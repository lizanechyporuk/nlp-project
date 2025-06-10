import { JSX, useEffect, useState, useRef } from "react";
import ChatMessage from "./ChatMessage/ChatMessage";
import styles from "./ChatBot.module.scss";

type MetricRequestFunction = (
  metricName: string,
  columnName: string | null
) => Promise<{ success: boolean; result?: any; message?: string }>;

type ChatBotProps = {
  onUploadComplete: (columns: string[]) => void;
  isBusy: boolean;
  onMetricRequest: MetricRequestFunction;
  onResetAll: () => void;
};

type MessageType = {
  type: "bot" | "user" | "options" | "table" | "metric_list";
  text?: string;
  data?: any;
  columns?: string[];
};

const createMessage = (
  type: "bot" | "user" | "options" | "table" | "metric_list",
  text?: string,
  data?: any,
  columns?: string[]
): MessageType => ({
  type,
  text,
  data,
  columns,
});

function ChatBot({
  onUploadComplete,
  isBusy,
  onMetricRequest,
  onResetAll,
}: ChatBotProps): JSX.Element {
  const [messages, setMessages] = useState<MessageType[]>([
    createMessage("bot", "Hello! What’s your name?"),
  ]);
  const [input, setInput] = useState("");
  const [userName, setUserName] = useState("");
  const [currentBotState, setCurrentBotState] = useState<
    "hello" | "thinking" | "answering"
  >("hello");
  const [inputMode, setInputMode] = useState<"csv" | "excel" | "text" | null>(
    null
  );
  const [conversationStage, setConversationStage] = useState<
    | "name_input"
    | "upload_choice"
    | "awaiting_file"
    | "post_upload"
    | "metric_selection"
    | "awaiting_metric_input"
  >("name_input");
  const [availableColumnsForMetrics, setAvailableColumnsForMetrics] = useState<
    string[]
  >([]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const commonMetrics = [
    "Mean",
    "Median",
    "Mode",
    "Std",
    "Variance",
    "Min",
    "Max",
    "Sum",
    "Count",
    "Skewness",
    "Kurtosis",
    "Word Count",
    "Char Count",
    "Unique Words",
    "Avg Word Length",
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isBusy) {
      setCurrentBotState("thinking");
    } else {
      if (
        conversationStage === "name_input" ||
        conversationStage === "upload_choice"
      ) {
        setCurrentBotState("hello");
      } else {
        setCurrentBotState("answering");
      }
    }
  }, [isBusy, conversationStage, userName]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    const userMessageLower = userMessage.toLowerCase();

    const newMessages = [...messages, createMessage("user", input)];
    setMessages(newMessages);
    setInput("");

    if (userMessageLower === "exit") {
      setInputMode(null);
      setUserName("");
      setAvailableColumnsForMetrics([]);
      onResetAll();
      setConversationStage("name_input");
      setTimeout(() => {
        setMessages([
          createMessage(
            "bot",
            `You stopped the process. All data has been cleared. Hello! What’s your name?`
          ),
        ]);
      }, 500);
      return;
    }

    if (conversationStage === "name_input") {
      setUserName(userMessage);
      setConversationStage("upload_choice");
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          createMessage(
            "bot",
            `Nice to meet you, ${userMessage}! How would you like to upload your dataset?`
          ),
          createMessage(
            "bot",
            "You can stop the process by writing 'exit' at any time."
          ),
          createMessage("options", ""),
        ]);
      }, 500);
      return;
    }

    if (
      conversationStage === "metric_selection" ||
      conversationStage === "awaiting_metric_input"
    ) {
      await handleMetricRequestInput(userMessage);
      setConversationStage("awaiting_metric_input");
      return;
    }

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        createMessage(
          "bot",
          `I'm not sure how to respond to that. Please upload a dataset or ask for a metric from the options provided.`
        ),
      ]);
    }, 500);
  };

  const handleUploadChoice = (choice: string) => {
    if (choice === "Upload CSV") {
      setInputMode("csv");
      setConversationStage("awaiting_file");
      setMessages((prev) => [
        ...prev,
        createMessage("user", choice),
        createMessage(
          "bot",
          `You chose: ${choice}. Please upload your CSV file.`
        ),
      ]);
    }
  };

  const renderInputMode = () => {
    switch (inputMode) {
      case "csv":
        return (
          <div className={styles.upload__area}>
            <label>Upload CSV file:</label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileUpload(e)}
            />
          </div>
        );
      default:
        return null;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setCurrentBotState("thinking");
    setMessages((prev) => [
      ...prev,
      { type: "bot", text: `Received file: ${file.name}. Analyzing...` },
    ]);

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Upload failed");
      }

      const data = await res.json();
      console.log("Analysis results:", data);

      setAvailableColumnsForMetrics(data.columns);
      onUploadComplete(data.columns);

      setConversationStage("post_upload");
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            text: `Analysis complete! Here are the first 5 rows of your dataset:`,
          },
          createMessage("table", undefined, data.first_five_rows),
          {
            type: "bot",
            text: `Please choose your X and Y axes on the right side and select a plot type.`,
          },
          {
            type: "bot",
            text: `Would you like to evaluate some metrics? You can ask by typing the metric name, e.g., "mean" or "std of column_name". Here are some common ones:`,
          },
          createMessage("metric_list", undefined, commonMetrics, data.columns),
        ]);
        setConversationStage("metric_selection");
      }, 500);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: `Oops! Something went wrong uploading the file: ${err.message}`,
        },
      ]);
      setConversationStage("upload_choice");
    } finally {
      setInputMode(null);
    }
  };

  const renderTable = (data: any[]) => {
    if (!data || data.length === 0) return null;

    const columns = Object.keys(data[0]);
    return (
      <div className={styles.table__container}>
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col) => (
                  <td key={`${rowIndex}-${col}`}>{String(row[col])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const handleMetricRequestInput = async (userInput: string) => {
    const metricRegex =
      /^(mean|median|mode|std|standard deviation|variance|min|max|sum|count|skewness|kurtosis|word count|char count|unique words|avg word length|words|characters)\s*(?:of\s+([a-zA-Z0-9_]+))?$/i;
    const match = userInput.match(metricRegex);

    let metricName = "";
    let columnName: string | null = null;

    if (match) {
      metricName = match[1];
      columnName = match[2] || null;
    } else {
      if (
        commonMetrics
          .map((m) => m.toLowerCase())
          .includes(userInput.toLowerCase())
      ) {
        metricName = userInput;
      } else {
        setMessages((prev) => [
          ...prev,
          createMessage(
            "bot",
            "Please specify a valid metric or use the format 'metric_name of column_name'."
          ),
        ]);
        return;
      }
    }

    if (!metricName) {
      setMessages((prev) => [
        ...prev,
        createMessage("bot", "Please specify a metric you want to calculate."),
      ]);
      return;
    }

    let standardizedMetricName = metricName.toLowerCase();
    if (standardizedMetricName === "standard deviation")
      standardizedMetricName = "std";
    if (standardizedMetricName === "word count")
      standardizedMetricName = "word_count";
    if (standardizedMetricName === "words")
      standardizedMetricName = "word_count";
    if (standardizedMetricName === "char count")
      standardizedMetricName = "char_count";
    if (standardizedMetricName === "characters")
      standardizedMetricName = "char_count";
    if (standardizedMetricName === "unique words")
      standardizedMetricName = "unique_words";
    if (
      standardizedMetricName === "avg word length" ||
      standardizedMetricName === "average word length"
    )
      standardizedMetricName = "avg_word_length";

    if (columnName && !availableColumnsForMetrics.includes(columnName)) {
      setMessages((prev) => [
        ...prev,
        createMessage(
          "bot",
          `Column '${columnName}' not found in your dataset. Please choose an existing column.`
        ),
      ]);
      return;
    }

    setMessages((prev) => [
      ...prev,
      createMessage("bot", "Sure! Give me a second..."),
    ]);

    const response = await onMetricRequest(standardizedMetricName, columnName);

    if (response.success && response.result) {
      const metricMessages: MessageType[] = [];
      for (const col in response.result) {
        const value = response.result[col];
        const formattedValue =
          typeof value === "object" && value !== null && !Array.isArray(value)
            ? JSON.stringify(value, null, 2)
            : value;
        metricMessages.push(
          createMessage(
            "bot",
            `The ${standardizedMetricName} of your data is: ${col}: ${formattedValue}`
          )
        );
      }
      setMessages((prev) => [...prev, ...metricMessages]);
    } else if (response.message) {
      setMessages((prev) => [...prev, createMessage("bot", response.message)]);
    } else {
      setMessages((prev) => [
        ...prev,
        createMessage(
          "bot",
          "An unexpected error occurred while calculating the metric."
        ),
      ]);
    }
  };

  return (
    <div className={styles.chat__container}>
      <div className={styles.avatar__container}>
        <img
          src={`./images/ChatBotComponent/bot-${currentBotState}.png`}
          alt="AI Bot"
        />
      </div>

      <div className={styles.chat__box}>
        {messages.map((msg, index) => {
          if (msg.type === "options") {
            return (
              <div key={index} className={styles.options}>
                <button onClick={() => handleUploadChoice("Upload CSV")}>
                  📁 Upload CSV file
                </button>
              </div>
            );
          } else if (msg.type === "table" && msg.data) {
            return <div key={index}>{renderTable(msg.data)}</div>;
          } else if (msg.type === "metric_list") {
            return (
              <div key={index} className={styles.metric_list}>
                <ul>
                  {commonMetrics.map((metric) => (
                    <li key={metric}>{metric}</li>
                  ))}
                </ul>
                {availableColumnsForMetrics.length > 0 && (
                  <p className={styles.metric_hint}>
                    You can type "metric_name of column_name" (e.g., "mean of{" "}
                    {availableColumnsForMetrics[0]}") or just "metric_name" for
                    all applicable columns.
                  </p>
                )}
              </div>
            );
          } else {
            return (
              <ChatMessage
                key={index}
                type={msg.type as "bot" | "user"}
                text={msg.text || ""}
              />
            );
          }
        })}
        <div ref={chatEndRef} />
      </div>

      {renderInputMode()}

      <div className={styles.input__area}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type your message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

export default ChatBot;
