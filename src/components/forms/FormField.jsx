"use client"

import { memo } from "react"
import { AlertCircle, CheckCircle } from "lucide-react"
import { Label } from "../ui/label"
import { Input } from "../ui/input"

export const FormField = memo(
  ({ label, id, error, success, touched, required, icon: Icon, helpText, children, className = "", ...props }) => {
    const hasError = touched && error
    const hasSuccess = touched && !error && props.value

    return (
      <div className={`space-y-2 ${className}`}>
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>

        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Icon
                className={`h-5 w-5 ${hasError ? "text-red-500" : hasSuccess ? "text-green-500" : "text-gray-400"}`}
              />
            </div>
          )}

          {children || (
            <Input
              id={id}
              className={`${Icon ? "pl-10" : ""} ${hasError ? "border-red-500 focus:ring-red-500" : hasSuccess ? "border-green-500 focus:ring-green-500" : ""}`}
              {...props}
            />
          )}

          {hasError && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
          )}

          {hasSuccess && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          )}
        </div>

        {helpText && !hasError && <p className="text-sm text-gray-500">{helpText}</p>}

        {hasError && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}
      </div>
    )
  },
)

FormField.displayName = "FormField"
