import styles from "./ChatMessage.module.scss";

const ChatMessage = ({
  type,
  text,
}: {
  type: "bot" | "user" | "options" | "table" | "metric_options";
  text: string;
}) => {
  return (
    <div
      className={`${styles.message} ${
        type === "bot" ? styles.bot : styles.user
      }`}
    >
      {text}
    </div>
  );
};

export default ChatMessage;
