sap.ui.define([], function () {
    "use strict";

    return {
        /**
         * Format score to one decimal place
         * @param {number} value - Score value
         * @returns {string} Formatted score
         */
        formatScore: function (value) {
            if (value === null || value === undefined) {
                return "0.0";
            }
            return parseFloat(value).toFixed(1);
        },

        /**
         * Get status state
         * @param {string} status - Status value
         * @returns {string} State for ObjectStatus
         */
        getStatusState: function (status) {
            switch (status) {
                case "EXCELLENT":
                    return "Success";
                case "GOOD":
                    return "Success";
                case "CRITICAL GAP":
                    return "Error";
                default:
                    return "None";
            }
        },

        /**
         * Get status icon
         * @param {string} status - Status value
         * @returns {string} Icon name
         */
        getStatusIcon: function (status) {
            switch (status) {
                case "EXCELLENT":
                case "GOOD":
                    return "sap-icon://status-positive";
                case "CRITICAL GAP":
                    return "sap-icon://status-critical";
                default:
                    return "sap-icon://status-inactive";
            }
        }
    };
});
