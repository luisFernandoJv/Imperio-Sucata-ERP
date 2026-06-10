"use client"

import { useState, useRef, useEffect } from "react"
import { Search, X } from "lucide-react"
import { useOnClickOutside } from "../../hooks/useOnClickOutside"
import { Input } from "../ui/input"

export function AutocompleteInput({
  value,
  onChange,
  suggestions = [],
  placeholder,
  onAddSuggestion,
  onRemoveSuggestion,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState([])
  const containerRef = useRef(null)

  useOnClickOutside(containerRef, () => setIsOpen(false))

  useEffect(() => {
    if (value) {
      const filtered = suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase()))
      setFilteredSuggestions(filtered)
    } else {
      setFilteredSuggestions(suggestions)
    }
  }, [value, suggestions])

  const handleSelect = (suggestion) => {
    onChange(suggestion)
    setIsOpen(false)
  }

  const handleChange = (e) => {
    const newValue = e.target.value
    onChange(newValue)
    setIsOpen(true)

    // Save suggestion if it's new
    if (newValue && !suggestions.includes(newValue) && onAddSuggestion) {
      const timer = setTimeout(() => {
        onAddSuggestion(newValue)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          value={value}
          onChange={handleChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("")
              setIsOpen(false)
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className="flex items-center justify-between px-4 py-2 hover:bg-blue-50 cursor-pointer group"
              onClick={() => handleSelect(suggestion)}
            >
              <span className="text-sm text-gray-700">{suggestion}</span>
              {onRemoveSuggestion && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveSuggestion(suggestion)
                  }}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
