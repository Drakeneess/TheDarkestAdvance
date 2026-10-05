import {
  Component,
  useEffect,
  useState,
} from 'react'

import type {
  ComponentType,
  ErrorInfo,
  ReactNode,
} from 'react'

import {
  evaluate,
} from '@mdx-js/mdx'

import {
  useMDXComponents,
} from '@mdx-js/react'

import * as runtime from 'react/jsx-runtime'

interface PreviewResult {
  source: string

  Content:
    | ComponentType
    | null

  error:
    | string
    | null
}

interface PreviewBoundaryProps {
  children: ReactNode

  resetKey: string
}

interface PreviewBoundaryState {
  error:
    | string
    | null
}

class PreviewErrorBoundary extends Component<
  PreviewBoundaryProps,
  PreviewBoundaryState
> {
  state:
    PreviewBoundaryState = {
      error: null,
    }

  static getDerivedStateFromError(
    error: unknown,
  ): PreviewBoundaryState {
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Error renderizando MDX.',
    }
  }

  componentDidCatch(
    error: Error,
    info: ErrorInfo,
  ) {
    console.error(
      'MDX render error:',
      error,
      info,
    )
  }

  componentDidUpdate(
    previousProps:
      PreviewBoundaryProps,
  ) {
    if (
      previousProps.resetKey !==
        this.props.resetKey &&
      this.state.error
    ) {
      this.setState({
        error: null,
      })
    }
  }

  render() {
    if (
      this.state.error
    ) {
      return (
        <div className="mdx-preview-error">
          <strong>
            Error de renderizado
          </strong>

          <pre>
            {
              this.state.error
            }
          </pre>
        </div>
      )
    }

    return this.props.children
  }
}

interface MdxPreviewProps {
  content: string
}

export function MdxPreview({
  content,
}: MdxPreviewProps) {
  const [
    result,
    setResult,
  ] =
    useState<PreviewResult>({
      source: '',
      Content: null,
      error: null,
    })

  useEffect(() => {
    let active = true

    const timeout =
      window.setTimeout(
        async () => {
          try {
            const module =
              await evaluate(
                content,
                {
                  ...runtime,

                  useMDXComponents,

                  baseUrl:
                    import.meta.url,
                },
              )

            if (!active) {
              return
            }

            setResult({
              source: content,

              Content:
                module.default as
                  ComponentType,

              error: null,
            })
          } catch (error) {
            if (!active) {
              return
            }

            setResult({
              source: content,

              Content: null,

              error:
                error instanceof
                Error
                  ? error.message
                  : 'No se pudo compilar MDX.',
            })
          }
        },
        180,
      )

    return () => {
      active = false

      window.clearTimeout(
        timeout,
      )
    }
  }, [content])

  const Content =
    result.Content

  return (
    <div className="mdx-preview">
      {result.source !==
        content && (
        <div className="mdx-preview-status">
          Actualizando preview…
        </div>
      )}

      {result.error ? (
        <div className="mdx-preview-error">
          <strong>
            MDX inválido
          </strong>

          <pre>
            {result.error}
          </pre>
        </div>
      ) : Content ? (
        <PreviewErrorBoundary
          resetKey={content}
        >
          <article className="mdx-preview-content">
            <Content />
          </article>
        </PreviewErrorBoundary>
      ) : (
        <div className="mdx-preview-empty">
          Nada que previsualizar.
        </div>
      )}
    </div>
  )
}