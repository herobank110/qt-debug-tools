"""Script to inject into the debug qt app to collect and emit data."""


def __qt_debug_tools_entry():
    import socket

    def collect_data():
        """Collect data from the Qt application."""
        from qtpy import QtWidgets

        app = QtWidgets.QApplication.instance()
        if app is None:
            raise RuntimeError("No QApplication instance found.")

        # Collect top-level widgets
        top_level_widgets = app.topLevelWidgets()
        return [widget.objectName() for widget in top_level_widgets]

    connection = socket.create_connection(("localhost", 41329))

    data = collect_data()
    import json

    connection.send(json.dumps(data).encode())


__qt_debug_tools_entry()
