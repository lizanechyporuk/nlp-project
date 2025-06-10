import pandas as pd
from sklearn.preprocessing import LabelEncoder
import numpy as np
import re

def generate_summary(df: pd.DataFrame):
    summary = df.describe(include="all").fillna("").to_dict()

    metrics = {
        "num_rows": df.shape[0],
        "num_columns": df.shape[1],
        "missing_values": int(df.isnull().sum().sum()),
        "duplicate_rows": int(df.duplicated().sum())
    }

    return summary, metrics

def calculate_metric(df: pd.DataFrame, metric_name: str, column_name: str = None):
    result = {}
    metric_name_lower = metric_name.lower()

    if column_name and column_name not in df.columns:
        return {"error": f"Column '{column_name}' not found in dataset."}

    supported_numeric_metrics = {
        'mean': 'mean', 'average': 'mean',
        'median': 'median',
        'mode': 'mode',
        'std': 'std', 'standard deviation': 'std',
        'variance': 'var',
        'min': 'min',
        'max': 'max',
        'sum': 'sum',
        'count': 'count',
        'skewness': 'skew',
        'kurtosis': 'kurt',
    }

    supported_text_metrics = {
        'word_count': 'word_count', 'words': 'word_count',
        'char_count': 'char_count', 'characters': 'char_count',
        'unique_words': 'unique_words', 'unique words': 'unique_words',
        'avg_word_length': 'avg_word_length', 'average word length': 'avg_word_length',
    }

    is_text_metric_request = metric_name_lower in supported_text_metrics

    target_columns = []
    if column_name:
        if is_text_metric_request and not pd.api.types.is_string_dtype(df[column_name]):
            return {"error": f"Cannot calculate '{metric_name}' for non-text column '{column_name}'."}
        elif not is_text_metric_request and not pd.api.types.is_numeric_dtype(df[column_name]):
            return {"error": f"Cannot calculate '{metric_name}' for non-numeric column '{column_name}'."}
        target_columns = [column_name]
    else:
        if is_text_metric_request:
            target_columns = df.select_dtypes(include=['object', 'string', 'category']).columns.tolist()
        else:
            target_columns = df.select_dtypes(include=np.number).columns.tolist()
        
        if not target_columns:
            return {"error": f"No suitable {'text' if is_text_metric_request else 'numeric'} columns found for '{metric_name}' in the dataset."}

    for col in target_columns:
        if is_text_metric_request:
            if not pd.api.types.is_string_dtype(df[col]):
                result[col] = f"Cannot calculate '{metric_name}' for non-text column."
                continue
            
            try:
                series_to_process = df[col].astype(str).replace('nan', '')

                if metric_name_lower == 'word_count' or metric_name_lower == 'words':
                    result[col] = series_to_process.apply(lambda x: len(re.findall(r'\b\w+\b', x.lower()))).sum()
                elif metric_name_lower == 'char_count' or metric_name_lower == 'characters':
                    result[col] = series_to_process.apply(lambda x: len(re.sub(r'\s+', '', x))).sum()
                elif metric_name_lower == 'unique_words' or metric_name_lower == 'unique words':
                    all_words = series_to_process.apply(lambda x: re.findall(r'\b\w+\b', x.lower())).explode().dropna()
                    result[col] = len(all_words.unique()) if not all_words.empty else 0
                elif metric_name_lower == 'avg_word_length' or metric_name_lower == 'average word length':
                    all_words = series_to_process.apply(lambda x: re.findall(r'\b\w+\b', x)).explode().dropna()
                    if not all_words.empty:
                        result[col] = all_words.apply(len).mean()
                    else:
                        result[col] = 0.0
            except Exception as e:
                result[col] = f"Calculation error for '{col}': {str(e)}"
        else:
            if not pd.api.types.is_numeric_dtype(df[col]):
                result[col] = f"Cannot calculate '{metric_name}' for non-numeric column."
                continue
            
            if metric_name_lower not in supported_numeric_metrics:
                if metric_name_lower == 'mse':
                    return {"error": "I do not provide calculations for such metrics as 'MSE' as it requires model predictions."}
                return {"error": "I do not provide calculations for such metrics."}

            pd_method_name = supported_numeric_metrics[metric_name_lower]
            try:
                if pd_method_name == 'mode':
                    modes = df[col].mode().tolist()
                    result[col] = modes[0] if len(modes) == 1 else modes
                else:
                    value = getattr(df[col], pd_method_name)()
                    if pd.isna(value):
                        result[col] = "N/A"
                    else:
                        result[col] = value
            except Exception as e:
                result[col] = f"Calculation error for '{col}': {str(e)}"
    
    if not result:
        return {"error": f"No suitable columns found for '{metric_name}' or calculation failed."}

    for key, value in result.items():
        if isinstance(value, (np.integer, np.floating)):
            result[key] = value.item()
        elif isinstance(value, np.ndarray):
            result[key] = value.tolist()

    return result
