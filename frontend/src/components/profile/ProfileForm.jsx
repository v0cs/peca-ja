import { useEffect, useMemo, useState } from "react";
import { Button, Input } from "../ui";
import ReadOnlyField from "./ReadOnlyField";

const defaultNormalizer = (value) => {
  if (typeof value === "string") {
    return value.trim();
  }
  return value ?? "";
};

const ProfileForm = ({
  fields = [],
  readOnlyFields = [],
  initialValues = {},
  onSubmit,
  submitLabel = "Salvar alterações",
  loading = false,
  validate, // function(values) => errors
  onDirtyChange,
  footer,
}) => {
  const [formValues, setFormValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [formFeedback, setFormFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  const editableFieldMap = useMemo(() => {
    const map = new Map();
    fields.forEach((field) => {
      map.set(field.name, field);
    });
    return map;
  }, [fields]);

  useEffect(() => {
    setFormValues(initialValues);
    setErrors({});
    setTouched({});
    setIsDirty(false);
    setFormFeedback(null);
  }, [initialValues]);

  useEffect(() => {
    onDirtyChange?.(isDirty);

    if (isDirty) {
      const handleBeforeUnload = (event) => {
        event.preventDefault();
        event.returnValue = "";
      };
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }
  }, [isDirty, onDirtyChange]);

  const computeIsDirty = (values) => {
    return fields.some((field) => {
      const normalize = field.normalize || defaultNormalizer;
      const initial = normalize(initialValues[field.name]);
      const current = normalize(values[field.name]);
      return initial !== current;
    });
  };

  const runFieldValidation = (name, value, values) => {
    const field = editableFieldMap.get(name);
    if (!field) return;

    let error = "";
    if (field.required && !defaultNormalizer(value)) {
      error = "Campo obrigatório";
    }

    if (!error && typeof field.validate === "function") {
      error = field.validate(value, values) || "";
    }

    setErrors((prev) => {
      if (error) {
        return { ...prev, [name]: error };
      }
      if (!prev[name]) return prev;
      const { [name]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleChange = (name, rawValue) => {
    const field = editableFieldMap.get(name);
    if (!field) return;

    let value = rawValue;
    if (typeof field.mask === "function") {
      value = field.mask(rawValue, formValues[name]);
    }

    setFormValues((prev) => {
      const updated = { ...prev, [name]: value };
      setIsDirty(computeIsDirty(updated));
      runFieldValidation(name, value, updated);
      return updated;
    });
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const collectValidationErrors = (values) => {
    const collectedErrors = {};

    fields.forEach((field) => {
      const value = values[field.name];
      if (field.required && !defaultNormalizer(value)) {
        collectedErrors[field.name] = "Campo obrigatório";
        return;
      }

      if (typeof field.validate === "function") {
        const error = field.validate(value, values);
        if (error) {
          collectedErrors[field.name] = error;
        }
      }
    });

    if (typeof validate === "function") {
      const extraErrors = validate(values);
      if (extraErrors && typeof extraErrors === "object") {
        Object.assign(collectedErrors, extraErrors);
      }
    }

    return collectedErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading || isSubmitting) return;

    const validationErrors = collectValidationErrors(formValues);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setTouched((prev) => ({
        ...prev,
        ...Object.keys(validationErrors).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {}
        ),
      }));
      return;
    }

    const payload = {};
    fields.forEach((field) => {
      const normalize = field.normalize || defaultNormalizer;
      payload[field.name] = normalize(formValues[field.name]);
    });

    setIsSubmitting(true);
    setFormFeedback(null);
    try {
      const result = (await onSubmit?.(payload)) || {};

      if (result.fieldErrors) {
        setErrors(result.fieldErrors);
      }

      if (result.message) {
        setFormFeedback({
          type: result.success ? "success" : "error",
          message: result.message,
        });
      } else if (result.success) {
        setFormFeedback({
          type: "success",
          message: "Dados salvos com sucesso.",
        });
      }

      if (result.success) {
        setIsDirty(false);
      }
    } catch (error) {
      const fieldErrors =
        error?.fieldErrors || error?.errors || error?.response?.data?.errors;
      if (fieldErrors) {
        setErrors(fieldErrors);
      }

      const message =
        error?.message ||
        error?.response?.data?.message ||
        "Não foi possível salvar as alterações. Tente novamente.";

      setFormFeedback({
        type: "error",
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formFeedback && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            formFeedback.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {formFeedback.message}
        </div>
      )}

      {readOnlyFields.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {readOnlyFields.map((field) => (
            <ReadOnlyField
              key={field.name}
              label={field.label}
              value={
                field.formatter
                  ? field.formatter(initialValues[field.name])
                  : initialValues[field.name]
              }
              helperText={field.helperText}
            />
          ))}
        </div>
      )}

      {fields.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {fields.map((field) => (
            <div
              key={field.name}
              className={field.fullWidth ? "md:col-span-2" : ""}
            >
              <Input
                id={field.name}
                name={field.name}
                type={field.type || "text"}
                label={field.label}
                value={formValues[field.name] ?? ""}
                onChange={(event) =>
                  handleChange(field.name, event.target.value)
                }
                onBlur={() => {
                  if (!touched[field.name]) {
                    setTouched((prev) => ({ ...prev, [field.name]: true }));
                  }
                  runFieldValidation(
                    field.name,
                    formValues[field.name],
                    formValues
                  );
                }}
                placeholder={field.placeholder}
                maxLength={field.maxLength}
                autoComplete={field.autoComplete}
                required={field.required}
                disabled={field.disabled || loading || isSubmitting}
                error={touched[field.name] ? errors[field.name] : ""}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={
              loading || isSubmitting || !isDirty || Object.keys(errors).length > 0
            }
          >
            {loading || isSubmitting ? "Salvando..." : submitLabel}
          </Button>
          {!isDirty && (
            <span className="text-sm text-gray-500">
              Faça alterações para habilitar o salvamento.
            </span>
          )}
        </div>
        {footer}
      </div>
    </form>
  );
};

export default ProfileForm;




