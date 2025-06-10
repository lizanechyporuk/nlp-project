import React, { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import styles from "./ResultsPanel.module.scss";

type ResultsPanelProps = {
  uploadTrigger: number;
  availableColumns: string[];
  onPlotLoadingChange: (isLoading: boolean) => void;
  resetTrigger: number;
};

type Metrics = {
  num_rows: number;
  num_columns: number;
  missing_values: number;
  duplicate_rows: number;
};

const plotTypes = ["histogram", "correlation", "boxplot", "scatter"];

const ResultsPanel: React.FC<ResultsPanelProps> = ({
  uploadTrigger,
  availableColumns,
  onPlotLoadingChange,
  resetTrigger,
}) => {
  const [selectedPlot, setSelectedPlot] = useState<string>("histogram");
  const [plotData, setPlotData] = useState<any>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [selectedXColumn, setSelectedXColumn] = useState<string>("");
  const [selectedYColumn, setSelectedYColumn] = useState<string>("");
  const [plotError, setPlotError] = useState<string | null>(null);

  const fetchPlot = async (type: string, xCol?: string, yCol?: string) => {
    onPlotLoadingChange(true);
    setPlotError(null);

    let url = `${process.env.REACT_APP_API_URL}/plot?type=${type}`;
    if (xCol) {
      url += `&x_column=${encodeURIComponent(xCol)}`;
    }
    if (yCol) {
      url += `&y_column=${encodeURIComponent(yCol)}`;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.detail?.error || errorData.detail || "Failed to fetch plot"
        );
      }
      const json = await res.json();
      setPlotData(json);
    } catch (error: any) {
      console.error("Error fetching plot:", error);
      setPlotData(null);
      setPlotError(
        error.message || "An unknown error occurred while fetching the plot."
      );
    } finally {
      onPlotLoadingChange(false);
    }
  };

  useEffect(() => {
    if (uploadTrigger > 0) {
      fetch(`${process.env.REACT_APP_API_URL}/upload-metrics`)
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch metrics");
          }
          return res.json();
        })
        .then((data) => setMetrics(data.metrics))
        .catch((err) => {
          console.error("Error fetching metrics:", err);
          setMetrics(null);
        });
    }
  }, [uploadTrigger]);

  useEffect(() => {
    if (uploadTrigger > 0 && availableColumns.length > 0) {
      setSelectedXColumn(availableColumns[0] || "");
      setSelectedYColumn(
        availableColumns.length > 1 ? availableColumns[1] : ""
      );
    } else if (uploadTrigger > 0 && availableColumns.length === 0) {
      setPlotData(null);
      setMetrics(null);
      setSelectedXColumn("");
      setSelectedYColumn("");
      setPlotError(
        "No columns found in the uploaded dataset to generate plots."
      );
      onPlotLoadingChange(false);
      console.warn("Dataset uploaded but no columns found.");
    }
  }, [uploadTrigger, availableColumns]);

  useEffect(() => {
    if (
      uploadTrigger > 0 &&
      (availableColumns.length > 0 || selectedPlot === "correlation")
    ) {
      fetchPlot(selectedPlot, selectedXColumn, selectedYColumn);
    } else if (uploadTrigger === 0) {
      setPlotData(null);
      setPlotError(null);
    }
  }, [selectedPlot, selectedXColumn, selectedYColumn, uploadTrigger]);

  useEffect(() => {
    if (resetTrigger > 0) {
      setPlotData(null);
      setMetrics(null);
      setSelectedPlot("histogram");
      setSelectedXColumn("");
      setSelectedYColumn("");
      setPlotError(null);
      onPlotLoadingChange(false);
    }
  }, [resetTrigger]);

  return (
    <div className={styles.results__panel}>
      <h2>📊 Data Visualizations</h2>

      {availableColumns.length > 0 && (
        <div className={styles.column__selectors}>
          <div>
            <label htmlFor="x-axis-select">Select X-axis:</label>
            <select
              id="x-axis-select"
              value={selectedXColumn}
              onChange={(e) => setSelectedXColumn(e.target.value)}
            >
              {availableColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          {selectedPlot === "scatter" && (
            <div>
              <label htmlFor="y-axis-select">Select Y-axis:</label>
              <select
                id="y-axis-select"
                value={selectedYColumn}
                onChange={(e) => setSelectedYColumn(e.target.value)}
              >
                {availableColumns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <label htmlFor="plot-type-select">Select a plot type:</label>
      <select
        id="plot-type-select"
        value={selectedPlot}
        onChange={(e) => setSelectedPlot(e.target.value)}
      >
        {plotTypes.map((type) => (
          <option key={type} value={type}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </option>
        ))}
      </select>

      <div className={styles["plot-container"]}>
        {plotError && <p className={styles.error_message}>{plotError}</p>}
        {plotData ? (
          <Plot
            data={plotData.data}
            layout={plotData.layout}
            style={{ width: "100%", height: "100%" }}
            useResizeHandler={true}
          />
        ) : (
          !plotError && (
            <p>
              No plot data available. Please upload a dataset to begin
              visualization.
            </p>
          )
        )}
      </div>

      <h3>📈 Evaluation Metrics</h3>
      {metrics ? (
        <ul>
          <li>
            <strong>Rows:</strong> {metrics.num_rows}
          </li>
          <li>
            <strong>Columns:</strong> {metrics.num_columns}
          </li>
          <li>
            <strong>Missing Values:</strong> {metrics.missing_values}
          </li>
          <li>
            <strong>Duplicate Rows:</strong> {metrics.duplicate_rows}
          </li>
        </ul>
      ) : (
        <p>No metrics available yet. Please upload a dataset.</p>
      )}
    </div>
  );
};

export default ResultsPanel;
