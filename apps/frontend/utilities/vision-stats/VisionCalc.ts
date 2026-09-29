import { DailyMetrics, SessionMetrics, VisionSession } from "./VisionTypes";

export const average = (values: number[]) =>
  values.length === 0
    ? 0
    : Number((values.reduce((x, y) => x + y, 0) / values.length).toFixed(1));

export const percent = (value: number) => `${value.toFixed(1)}%`;

export const formatDate = (isoString: string) =>
  new Date(`${isoString}T00:00:00`).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
  });

export function toMetrics(session: VisionSession): SessionMetrics {
  const data = session.data;

  const motionTotal = data.total_restless_frames + data.total_stable_frames;
  const attentionTotal = data.total_paying_attention + data.total_no_attention;

  const stillPercentage =
    motionTotal === 0
      ? 0
      : Number(((data.total_stable_frames / motionTotal) * 100).toFixed(1));

  const attentionPercentage =
    attentionTotal === 0
      ? 0
      : Number(
          ((data.total_paying_attention / attentionTotal) * 100).toFixed(1),
        );

  return {
    id: session.sessionID,
    name: session.sessionName,
    date: session.date,
    eventId: session.eventID ?? null,
    questions: data.questions_asked,

    restlessPercentage:
      motionTotal === 0
        ? 0
        : Number(((data.total_restless_frames / motionTotal) * 100).toFixed(1)),

    stillPercentage: stillPercentage,
    attentionPercentage: attentionPercentage,

    noAttentionPercentage:
      attentionTotal === 0
        ? 0
        : Number(((data.total_no_attention / attentionTotal) * 100).toFixed(1)),

    engagement: Number(
      ((stillPercentage + attentionPercentage) / 2).toFixed(1),
    ),
    totalFrames: data.total_frames,
  };
}

export function toDaily(metrics: SessionMetrics[]): DailyMetrics[] {
  const groupedByDate: Record<string, SessionMetrics[]> = {};

  for (const metric of metrics) {
    if (!groupedByDate[metric.date]) {
      groupedByDate[metric.date] = [];
    }

    groupedByDate[metric.date].push(metric);
  }

  const averageProperty = (
    group: SessionMetrics[],
    key: keyof SessionMetrics,
  ) => average(group.map((item) => item[key] as number));

  return Object.keys(groupedByDate)
    .sort()
    .map((date) => {
      const group = groupedByDate[date];
      return {
        date,
        sessions: group.length,
        questions: averageProperty(group, "questions"),
        restlessPercentage: averageProperty(group, "restlessPercentage"),
        stillPercentage: averageProperty(group, "stillPercentage"),
        attentionPercentage: averageProperty(group, "attentionPercentage"),
        noAttentionPercentage: averageProperty(group, "noAttentionPercentage"),
        engagement: averageProperty(group, "engagement"),
      };
    });
}

//adapter for the dynamic chart we have
export const toChartRows = (dailyMetrics: DailyMetrics[]) =>
  dailyMetrics.map((daily) => ({
    ...daily,
    xKey: formatDate(daily.date),
  }));

export function correlation(
  xValues: number[],
  yValues: number[],
): number | null {
  if (xValues.length < 3 || xValues.length !== yValues.length) {
    return null;
  }

  const meanX = xValues.reduce((x, y) => x + y, 0) / xValues.length;
  const meanY = yValues.reduce((x, y) => x + y, 0) / yValues.length;

  let numerator = 0;
  let varianceX = 0;

  let varianceY = 0;

  for (let i = 0; i < xValues.length; i++) {
    const differenceX = xValues[i] - meanX;
    const differenceY = yValues[i] - meanY;

    numerator += differenceX * differenceY;
    varianceX += differenceX ** 2;
    varianceY += differenceY ** 2;
  }

  const denominator = Math.sqrt(varianceX * varianceY);

  return denominator === 0 ? null : numerator / denominator;
}
