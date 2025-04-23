import React from "react";
import { Box, Typography } from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";
import { FieldLabelProps } from "../types";
import "./FieldLabel.css";

const FieldLabel: React.FC<FieldLabelProps> = ({ name, required, isValid }) => {
  return (
    <Box className="field-label-container">
      <Typography variant="subtitle2" className="field-name">
        {name} {required && <span className="required-indicator">*</span>}
      </Typography>
      {isValid !== null && (
        <Box className="validation-indicator">
          {isValid ? (
            <CircleIcon className="valid-icon" />
          ) : (
            <CircleIcon className="invalid-icon" />
          )}
        </Box>
      )}
    </Box>
  );
};

export default FieldLabel; 