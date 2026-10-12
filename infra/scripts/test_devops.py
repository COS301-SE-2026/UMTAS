"""Local contract tests for health verification and rollback control flow."""
import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('verify', ROOT / 'infra/scripts/verify-deployment.py')
verifier = importlib.util.module_from_spec(spec)
spec.loader.exec_module(verifier)


class VerificationTests(unittest.TestCase):
    def response(self, data):
        response = io.BytesIO(json.dumps(data).encode())
        response.status = 200
        return response

    def test_accepts_matching_ready_release(self):
        with patch.object(verifier, 'urlopen', side_effect=[self.response({}), self.response({'services': {'database': 'ok', 'redis': 'ok'}}), self.response({'version': 'v1.0.0'})]):
            verifier.verify('https://example.test', 'v1.0.0', attempts=1)

    def test_rejects_wrong_release_and_unready_dependencies(self):
        for health, version in [({'database': 'ok', 'redis': 'error'}, 'v1.0.0'), ({'database': 'ok', 'redis': 'ok'}, 'v0.9.0')]:
            with patch.object(verifier, 'urlopen', side_effect=[self.response({}), self.response({'services': health}), self.response({'version': version})]):
                with self.assertRaises(SystemExit):
                    verifier.verify('https://example.test', 'v1.0.0', attempts=1)


class RollbackTests(unittest.TestCase):
    def run_deploy(self, failure, running='v1.0.0'):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder)
            (path / 'docker').write_text('''#!/bin/sh
printf '%s %s\\n' "$IMAGE_TAG" "$*" >> "$TEST_LOG"
case "$*" in
  *'ps -q backend'*) echo container-id ;;
  inspect*) echo "vigilcs/umtas:backend-$RUNNING_TAG" ;;
esac
''')
            (path / 'python3').write_text('''#!/bin/sh
printf 'verify %s\\n' "$*" >> "$TEST_LOG"
if [ "$FAIL_RELEASE" = 1 ] && [ "$3" = v1.1.0 ]; then exit 1; fi
''')
            for filename in ['docker', 'python3']:
                (path / filename).chmod(0o700)
            env = {**os.environ, 'PATH': folder + os.pathsep + os.environ['PATH'], 'TEST_LOG': str(path / 'events'), 'RUNNING_TAG': running, 'FAIL_RELEASE': str(failure), 'PROD_APP_DOMAIN': 'example.test', 'DOCKER_REGISTRY': 'vigilcs/umtas'}
            result = subprocess.run(['bash', 'infra/scripts/deploy-production.sh', 'v1.1.0', 'v1.0.0'], cwd=ROOT, env=env, capture_output=True, text=True)
            return result, (path / 'events').read_text()

    def test_failed_verification_rolls_back_and_fails_workflow(self):
        result, events = self.run_deploy(1)
        self.assertEqual(result.returncode, 1)
        self.assertIn('v1.0.0 compose -p umtas-prod -f docker-compose.prod.yml up', events)
        self.assertIn('https://example.test v1.0.0', events)
        self.assertNotIn(' down', events)

    def test_success_and_mismatched_previous_tag(self):
        result, events = self.run_deploy(0)
        self.assertEqual(result.returncode, 0)
        self.assertNotIn('v1.0.0 compose -p umtas-prod -f docker-compose.prod.yml up', events)
        result, events = self.run_deploy(0, running='v0.8.0')
        self.assertEqual(result.returncode, 2)
        self.assertNotIn(' pull', events)


if __name__ == '__main__':
    unittest.main()
