from fastapi import FastAPI, UploadFile, File, Query, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from utils.analysis import generate_summary, calculate_metric
from utils.plots import generate_plot
import pandas as pd
import tempfile
import plotly.io as pio
import json
import os
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://lizanechyporuk.github.io/nlp-project/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.df = None
app.state.metrics = None
app.state.df_columns = []

@app.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed for upload.")

    contents = await file.read()
    with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        df = pd.read_csv(tmp_path)
    except Exception as e:
        os.unlink(tmp_path)
        raise HTTPException(status_code=400, detail=f"Failed to read CSV file: {e}")
    finally:
        os.unlink(tmp_path)

    summary, metrics = generate_summary(df)

    app.state.df = df
    app.state.metrics = metrics
    app.state.df_columns = df.columns.tolist()

    return {
        "columns": df.columns.tolist(),
        "summary": summary,
        "metrics": metrics,
        "first_five_rows": df.head().to_dict(orient="records")
    }

@app.get("/plot")
def get_plot(type: str = Query(...), x_column: str = Query(None), y_column: str = Query(None)):
    df = app.state.df
    if df is None:
        raise HTTPException(status_code=400, detail={"error": "No dataset uploaded yet"})

    if x_column and x_column not in df.columns:
        raise HTTPException(status_code=400, detail={"error": f"X-column '{x_column}' not found in dataset."})
    if y_column and y_column not in df.columns:
        raise HTTPException(status_code=400, detail={"error": f"Y-column '{y_column}' not found in dataset."})

    try:
        fig = generate_plot(type, df, x_column=x_column, y_column=y_column)
        fig_json = json.loads(pio.to_json(fig))
        return fig_json
    except ValueError as ve:
        raise HTTPException(status_code=400, detail={"error": str(ve)})
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"error": f"Plot generation failed: {str(e)}"}
        )

@app.get("/upload-metrics")
def get_metrics():
    if app.state.metrics is None:
        raise HTTPException(status_code=400, detail={"error": "No metrics available yet"})

    return {"metrics": app.state.metrics}

@app.post("/calculate-metric")
async def calculate_custom_metric(data: dict = Body(...)):
    metric_name = data.get("metric_name")
    column_name = data.get("column_name")
    
    df = app.state.df
    if df is None:
        raise HTTPException(status_code=400, detail="No dataset uploaded yet.")
    
    if not metric_name:
        raise HTTPException(status_code=400, detail="Metric name is required.")

    result = calculate_metric(df, metric_name, column_name)
    
    if isinstance(result, dict) and len(result) == 1 and "error" in result:
        error_message = result["error"]
        if isinstance(error_message, str):
            if "I do not provide calculations for such metrics." in error_message or \
               "I do not provide calculations for such metrics as 'MSE'" in error_message:
                return JSONResponse(status_code=200, content={"message": error_message})
            else:
                raise HTTPException(status_code=400, detail=error_message)
        else:
            raise HTTPException(status_code=500, detail=f"Unexpected error format from calculation: {error_message}")

    return {"metric_name": metric_name, "column_name": column_name, "result": result}
