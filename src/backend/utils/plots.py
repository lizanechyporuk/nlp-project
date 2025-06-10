import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import plotly.io as pio

def generate_plot(plot_type: str, df: pd.DataFrame, x_column: str = None, y_column: str = None):
    pio.templates.default = "plotly_white"

    fig = None
    if plot_type == "histogram":
        if x_column and x_column in df.columns:
            fig = px.histogram(df, x=x_column, title=f"Distribution of {x_column}")
        else:
            numeric_cols = df.select_dtypes(include=['number']).columns
            if not numeric_cols.empty:
                fig = px.histogram(df, x=numeric_cols[0], title=f"Distribution of {numeric_cols[0]}")
            else:
                raise ValueError("No suitable numeric column available for histogram.")
    elif plot_type == "correlation":
        numeric_df = df.select_dtypes(include=['number'])
        if numeric_df.empty:
            raise ValueError("No numeric columns available to compute correlation.")
        if len(numeric_df.columns) < 2:
            raise ValueError("Need at least two numeric columns for a meaningful correlation matrix.")
        corr = numeric_df.corr()
        fig = px.imshow(
            corr,
            text_auto=True,
            aspect="auto",
            color_continuous_scale=px.colors.sequential.Plasma,
            title="Correlation Matrix"
        )
    elif plot_type == "boxplot":
        if x_column and x_column in df.columns:
            fig = px.box(df, y=x_column, title=f"Box Plot of {x_column}")
        else:
            numeric_cols = df.select_dtypes(include=['number']).columns
            if not numeric_cols.empty:
                fig = px.box(df, y=numeric_cols[0], title=f"Box Plot of {numeric_cols[0]}")
            else:
                raise ValueError("No suitable numeric column available for box plot.")
    elif plot_type == "scatter":
        if x_column and y_column and x_column in df.columns and y_column in df.columns:
            fig = px.scatter(df, x=x_column, y=y_column, title=f"Scatter Plot of {x_column} vs {y_column}")
        else:
            numeric_cols = df.select_dtypes(include=['number']).columns
            if len(numeric_cols) >= 2:
                fig = px.scatter(df, x=numeric_cols[0], y=numeric_cols[1], title=f"Scatter Plot of {numeric_cols[0]} vs {numeric_cols[1]}")
            else:
                raise ValueError("Not enough numeric columns for scatter plot.")
    else:
        raise ValueError(f"Unknown plot type: {plot_type}")

    if fig:
        fig.update_layout(
            font=dict(family="Inter", size=12, color="#333"),
            hovermode="closest"
        )
    return fig

