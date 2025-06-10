import { JSX, useState } from "react";
import styles from "./MainSection.module.scss";
import ChatBot from "components/ChatBot";
import ResultsPanel from "components/ResultsPanel";

function MainSection(): JSX.Element {
  const [uploadTrigger, setUploadTrigger] = useState<number>(0);
  const [currentAvailableColumns, setCurrentAvailableColumns] = useState<
    string[]
  >([]);
  const [isPlotLoading, setIsPlotLoading] = useState<boolean>(false);
  const [isMetricCalculating, setIsMetricCalculating] =
    useState<boolean>(false);
  const [resetPanelTrigger, setResetPanelTrigger] = useState<number>(0);

  const isBusy = isPlotLoading || isMetricCalculating;

  const handleUploadComplete = (columns: string[]) => {
    setUploadTrigger((prev) => prev + 1);
    setCurrentAvailableColumns(columns);
  };

  const handlePlotLoadingChange = (isLoading: boolean) => {
    setIsPlotLoading(isLoading);
  };

  const handleMetricRequest = async (
    metricName: string,
    columnName: string | null
  ) => {
    setIsMetricCalculating(true);
    const payload = { metric_name: metricName, column_name: columnName };
    console.log("Sending metric request payload:", payload);

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/calculate-metric`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to calculate metric.");
      } else if (data.message) {
        return { success: false, message: data.message };
      } else {
        return { success: true, result: data.result };
      }
    } catch (error: any) {
      console.error("Error calculating metric:", error);
      return {
        success: false,
        message: error.message || "An unexpected error occurred.",
      };
    } finally {
      setIsMetricCalculating(false);
    }
  };

  const handleResetAll = () => {
    setResetPanelTrigger((prev) => prev + 1);
    setCurrentAvailableColumns([]);
    setIsPlotLoading(false);
    setIsMetricCalculating(false);
    setUploadTrigger(0);
  };

  return (
    <section className={styles.main__section}>
      <ChatBot
        onUploadComplete={handleUploadComplete}
        isBusy={isBusy}
        onMetricRequest={handleMetricRequest}
        onResetAll={handleResetAll}
      />
      <ResultsPanel
        uploadTrigger={uploadTrigger}
        availableColumns={currentAvailableColumns}
        onPlotLoadingChange={handlePlotLoadingChange}
        resetTrigger={resetPanelTrigger}
      />
    </section>
  );
}

export default MainSection;
