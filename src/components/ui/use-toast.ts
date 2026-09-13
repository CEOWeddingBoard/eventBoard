// Inspired by react-hot-toast library
import * as React from "react"

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}

const TOAST_LIMIT = 1

type ToasterProps = {
  toasts: ToasterToast[]
  publish: (toast: Omit<ToasterToast, "id">) => void
  dismiss: (toastId?: string) => void
}

let memoryState: ToasterProps = { toasts: [], publish: () => {}, dismiss: () => {} }

function dispatch(action: { type: "ADD_TOAST"; toast: Omit<ToasterToast, "id"> } | { type: "DISMISS_TOAST"; toastId?: string }) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type ToastProps = Record<string, unknown>

type ToastAction = { type: "ADD_TOAST"; toast: Omit<ToasterToast, "id"> } | { type: "DISMISS_TOAST"; toastId?: string }

const reducer = (state: ToasterProps, action: ToastAction): ToasterProps => {
  switch (action.type) {
    case "ADD_TOAST":
      const id = Math.random().toString(36).substr(2, 9)
      return {
        ...state,
        toasts: [{ ...action.toast, id }, ...state.toasts].slice(0, TOAST_LIMIT),
      }
    case "DISMISS_TOAST":
      if (action.toastId) {
        return {
          ...state,
          toasts: state.toasts.filter((t) => t.id !== action.toastId),
        }
      }
      return { ...state, toasts: [] }
    default:
      return state
  }
}

const listeners: Array<(state: ToasterProps) => void> = []

export function useToast() {
  const [state, setState] = React.useState<ToasterProps>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast: (props: Omit<ToasterToast, "id">) => {
      dispatch({ type: "ADD_TOAST", toast: props })
    },
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}
