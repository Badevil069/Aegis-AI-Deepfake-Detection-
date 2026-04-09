import streamlit as st

def render_oracle_hud(status="safe"):
    """
    Renders the Oracle HUD.
    Status can be 'safe', 'warning', or 'danger'.
    """
    if status == "safe":
        css_class = "oracle-status-safe"
        text = "SAFE"
    elif status == "warning":
        css_class = "oracle-status-warning"
        text = "CAUTION"
    else:
        css_class = "oracle-status-danger"
        text = "FRAUD"

    html = f"""
    <div class="oracle-circle {css_class}">
        {text}
    </div>
    """
    st.markdown(html, unsafe_allow_html=True)

def render_terminal(logs):
    """
    Renders a live terminal console with the latest logs.
    """
    log_content = "<br>".join([f"> {log}" for log in logs])
    html = f"""
    <div class="terminal-log" id="terminal">
        {log_content}
        <script>
            var elem = document.getElementById('terminal');
            elem.scrollTop = elem.scrollHeight;
        </script>
    </div>
    """
    st.markdown(html, unsafe_allow_html=True)
