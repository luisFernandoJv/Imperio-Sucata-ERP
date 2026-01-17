"use client"

import { useState } from "react"

export function useFormValidation(schema) {
  const [errors, setErrors] = useState({})

  const validate = (data) => {
    try {
      schema.parse(data)
      setErrors({})
      return true
    } catch (error) {
      if (error.errors) {
        const formattedErrors = {}
        error.errors.forEach((err) => {
          const path = err.path.join(".")
          formattedErrors[path] = err.message
        })
        setErrors(formattedErrors)
      }
      return false
    }
  }

  const clearErrors = () => setErrors({})

  const clearError = (field) => {
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }

  return {
    errors,
    validate,
    clearErrors,
    clearError,
  }
}
