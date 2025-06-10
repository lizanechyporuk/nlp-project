Interactive Data Analysis Chatbot
Project Overview
This project presents an interactive web application designed to simplify data analysis for non-technical users. It integrates a conversational chatbot, powered by Natural Language Processing (NLP), that allows users to upload CSV datasets and perform various analytical tasks—such as calculating descriptive statistics and generating data visualizations—using natural language commands. The goal is to democratize data insights by providing an intuitive, accessible interface for data exploration.

Features
CSV File Upload: Easily upload your .csv datasets for immediate analysis.

Conversational Interface: Interact with the application through a chatbot using natural language queries.

Intelligent Intent & Entity Recognition: The NLP backend understands your requests for metrics and plots, extracting relevant information like column names.

Numeric Data Analysis: Calculate common statistical metrics (mean, median, mode, standard deviation, variance, min, max, sum, count, skewness, kurtosis) for numeric columns, either for specific columns or across all applicable columns.

Text Data Analysis: Gain insights from text columns with specialized metrics including total word count, total character count, unique word count, and average word length.

Interactive Data Visualizations: Generate various plot types (histograms, correlation plots, box plots, scatter plots) to visualize your data interactively.

Real-time Feedback: The chatbot provides visual cues ("thinking" animation) when processing requests.

Full Reset Functionality: Type "exit" at any time to clear the current session and reset the application to its initial state.

Technologies Used
This project leverages a modern web development stack:

Frontend:

React: A JavaScript library for building user interfaces.

SCSS (Sass): A CSS pre-processor for enhanced styling.

Plotly.js: For rendering interactive data visualizations in the browser.

Backend:

Python: The primary programming language.

FastAPI: A modern, fast (high-performance) web framework for building APIs.

Pandas: A powerful data manipulation and analysis library.

NumPy: Essential for numerical operations, especially when integrating with Pandas.

Plotly (Python library): For generating plot specifications server-side.

re (Python's re module): For regular expression-based NLP tasks.

Setup and Installation
Follow these steps to get the project up and running on your local machine.

1. Clone the Repository
   git clone <your_github_repo_link>
   cd <your_project_directory>

(Replace <your_github_repo_link> with the actual link to your GitHub repository and <your_project_directory> with the name of the folder created by cloning.)

2. Backend Setup
   Navigate to the src/backend directory.

cd src/backend

Create a Virtual Environment (Recommended)
python -m venv venv

Activate the Virtual Environment
Windows:

.\venv\Scripts\activate

macOS/Linux:

source venv/bin/activate

Install Backend Dependencies
pip install -r requirements.txt

(If you don't have a requirements.txt file, you can create one by running pip freeze > requirements.txt after manually installing fastapi, uvicorn, pandas, numpy, plotly, scikit-learn (for LabelEncoder if still used, though it's optional for current analysis), and python-multipart (for file uploads).)

3. Frontend Setup
   Open a new terminal and navigate to the src/frontend directory.

cd src/frontend

Install Frontend Dependencies
npm install # or yarn install

Configure Environment Variables
Create a .env file in the src/frontend directory with the following content, ensuring it points to your backend server:

REACT_APP_API_URL=http://127.0.0.1:8000

How to Run the Application

1. Start the Backend Server
   From the src/backend directory (with your virtual environment activated):

uvicorn main:app --reload

This will start the FastAPI server, typically on http://127.0.0.1:8000. The --reload flag ensures that the server automatically restarts when you make changes to your backend code.

2. Start the Frontend Development Server
   From the src/frontend directory:

npm start # or yarn start

This will open the React application in your default browser, typically at http://localhost:3000.

How to Use the Application
Start the Conversation: The chatbot will greet you and ask for your name. Type your name and press Enter.

Upload Your Dataset: The bot will prompt you to upload a CSV file. Use the "Upload CSV file" button and select your desired dataset.

Explore Data Visualizations: Once the dataset is uploaded, the right panel (ResultsPanel) will display initial data metrics and allow you to select X and Y axes to generate various plots (histogram, correlation, boxplot, scatter).

Request Metrics: In the chat interface, you can ask for statistical metrics:

General Metrics: Type a metric name (e.g., "mean", "std", "word count") to get results for all applicable columns.

Column-Specific Metrics: Type a metric name followed by "of" and the column name (e.g., "median of Age", "unique words of Description").

Text Metrics: Try "word count", "char count", "unique words", or "avg word length" for text columns.

Reset: To clear the session and upload a new dataset, simply type "exit" in the chat.

Project Structure
.
├── public/
│ │ │ └── images/
│ │ │ └── ChatBotComponent/ # Bot images (bot-hello.png, bot-thinking.png, etc.)
| | | └── images/
│ │ │ └── logoicon.png # Logo icon
├── src/
│ ├── backend/
│ │ ├── main.py # FastAPI application, API endpoints
│ │ ├── utils/
│ │ │ ├── analysis.py # Data analysis and metric calculation logic (Pandas, NumPy)
│ │ │ └── plots.py # Plot generation logic (Plotly)
│ │ └── venv/ # Python virtual environment (if created)
│ │ └── requirements.txt # Backend Python dependencies
│ |
│ ├── App.tsx # Main React component
│ ├── index.tsx # React app entry point
│ ├── components/
│ │ ├── ChatBot/
│ │ │ ├── ChatBox.tsx # Main chatbot component
│ │ │ ├── ChatBot.module.scss # Styling for ChatBox
│ │ │ └── ChatMessage/
│ │ │ └── ChatMessage.tsx # Individual chat message component
│ │ └── ResultsPanel/
│ │ ├── ResultsPanel.tsx # Component for displaying plots and metrics
│ │ └── ResultsPanel.module.scss # Styling for ResultsPanel
│ ├── modules/
| | |├── MainSection/
| │ │ │ ├── MainSection.tsx # Layout component for ChatBot and ResultsPanel
| │ │ │ └── MainSection.module.scss # Styling for MainSection
| | |├── Layout/
| │ │ │ ├── Layout.tsx # Layout component for the whole website
| │ │ │ └── Layout.module.scss # Styling for LAyout
│ ├── pages/
| | |├── HomePage/
| │ │ │ ├── HomePage.tsx # Main page of the website
| │ │ │ └── HomePage.module.scss # Styling for HomePage
│ ├── styles/
| │ │ ├── main.scss # Main scss file for the website
| │ │ └── variables.scss # Transmit of main styles
└── .env # Frontend environment variables
│── package.json # Frontend dependencies and scripts
│── package-lock.json
└── README.md # This file

Future Enhancements
The project has significant potential for future development, including:

Advanced NLP Integration: Incorporating advanced machine learning-based NLP models (e.g., fine-tuned LLMs or BERT) for richer semantic understanding, synonym handling, and more flexible query parsing.

Contextual Dialogue: Implementing sophisticated dialogue state management to enable multi-turn conversations and handle follow-up questions.

Complex Query Support: Extending the NLP engine to process more complex analytical queries involving conditions, aggregations, and comparisons directly through natural language.

Natural Language Plotting Control: Allowing users to specify all plotting parameters (axes, types, filters) entirely through natural language commands.

Advanced Text Analytics: Adding capabilities for sentiment analysis, topic modeling, named entity recognition, and text summarization for deeper text insights.

Error Handling & Clarification: Enhancing the chatbot's ability to proactively clarify ambiguous user inputs or guide users when a query cannot be fulfilled.

License
This project is open-source and available under the MIT License. You are free to use, modify, and distribute this software.
