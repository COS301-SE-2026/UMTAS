import HelloButton from "@/components/HelloButton";
import AuthSection from "@/components/AuthSection";

export default function Home() {
  return (
    <div className="verification-page">
      <main className="verification-main">
        <div className="verification-header">
          <h1 className="verification-title">UMTAS Stack Verification</h1>
          <p className="verification-subtitle">
            Validate that the full stack is connected: Next.js → NestJS →
            PostgreSQL
          </p>
        </div>

        <div className="verification-cards">
          <div className="status-card">
            <div className="status-card-icon">⚛️</div>
            <div className="status-card-label">Frontend</div>
            <div className="status-card-value status-card-value--up">
              Next.js
            </div>
          </div>
          <div className="status-card-arrow">→</div>
          <div className="status-card">
            <div className="status-card-icon">🔧</div>
            <div className="status-card-label">Backend</div>
            <div className="status-card-value">NestJS</div>
          </div>
          <div className="status-card-arrow">→</div>
          <div className="status-card">
            <div className="status-card-icon">🐘</div>
            <div className="status-card-label">Database</div>
            <div className="status-card-value">PostgreSQL</div>
          </div>
        </div>

        <div className="verification-action">
          <p className="verification-instruction">
            Press the button below to send a request through the entire stack
          </p>
          <AuthSection />
          <HelloButton />
        </div>
      </main>
    </div>
  );
}
