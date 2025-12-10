sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "bpfsagentui/model/formatter"
], function (Controller, JSONModel, MessageBox, MessageToast, formatter) {
    "use strict";

    return Controller.extend("bpfsagentui.controller.Main", {
        formatter: formatter,

        onInit: function () {
            // Initialize view model
            var oViewModel = new JSONModel({
                busy: false,
                fsFileUploaded: false,
                jouleFileUploaded: false,
                comparisonResult: null,
                fsFile: null,
                jouleFile: null
            });
            this.getView().setModel(oViewModel);
        },

        _getBaseUrl: function () {
            // In production, this will be routed through app router
            // In development, you might need to configure a proxy
            return window.location.origin;
        },

        onFsFileChange: function (oEvent) {
            var oFileUploader = oEvent.getSource();
            var oFile = oEvent.getParameter("files")[0];
            
            if (oFile) {
                this.getView().getModel().setProperty("/fsFile", oFile);
                this.getView().getModel().setProperty("/fsFileUploaded", true);
                MessageToast.show("FS Document selected: " + oFile.name);
            }
        },

        onJouleFileChange: function (oEvent) {
            var oFileUploader = oEvent.getSource();
            var oFile = oEvent.getParameter("files")[0];
            
            if (oFile) {
                this.getView().getModel().setProperty("/jouleFile", oFile);
                this.getView().getModel().setProperty("/jouleFileUploaded", true);
                MessageToast.show("Joule Response selected: " + oFile.name);
            }
        },

        onCompare: function () {
            var oModel = this.getView().getModel();
            var oFsFile = oModel.getProperty("/fsFile");
            var oJouleFile = oModel.getProperty("/jouleFile");

            if (!oFsFile || !oJouleFile) {
                MessageBox.error("Please upload both documents before comparing.");
                return;
            }

            // Show busy dialog with AI message
            var oBusyDialog = this.byId("busyDialog");
            oBusyDialog.open();

            // Create form data
            var oFormData = new FormData();
            oFormData.append("fsDocument", oFsFile);
            oFormData.append("jouleResponse", oJouleFile);

            // Get API base URL
            var sBaseUrl = this._getBaseUrl();

            // Call comparison API
            fetch(sBaseUrl + "/api/compare", {
                method: "POST",
                body: oFormData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Comparison failed: " + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    oModel.setProperty("/comparisonResult", data.comparison);
                    MessageToast.show("AI-powered document comparison completed successfully!");
                    
                    // Scroll to results
                    setTimeout(() => {
                        var oResultsPanel = this.byId("resultsPanel");
                        if (oResultsPanel) {
                            oResultsPanel.getDomRef().scrollIntoView({ behavior: "smooth" });
                        }
                    }, 100);
                } else {
                    throw new Error(data.error || "Comparison failed");
                }
            })
            .catch(error => {
                console.error("Comparison error:", error);
                MessageBox.error("Failed to compare documents: " + error.message);
            })
            .finally(() => {
                oBusyDialog.close();
            });
        },

        onClear: function () {
            var oModel = this.getView().getModel();
            
            // Reset file uploaders
            this.byId("fsFileUploader").clear();
            this.byId("jouleFileUploader").clear();
            
            // Reset model
            oModel.setProperty("/fsFileUploaded", false);
            oModel.setProperty("/jouleFileUploaded", false);
            oModel.setProperty("/comparisonResult", null);
            oModel.setProperty("/fsFile", null);
            oModel.setProperty("/jouleFile", null);
            
            MessageToast.show("Form cleared");
        }
    });
});
