import {
  useState,
} from 'react'

import {
  loginWriter,
  WriterLoginError,
} from './client'

export function LoginScreen() {
  const [
    username,
    setUsername,
  ] = useState('')

  const [
    password,
    setPassword,
  ] = useState('')

  const [
    submitting,
    setSubmitting,
  ] = useState(false)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null,
  )

  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (submitting) {
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    try {
      await loginWriter(
        username.trim(),
        password,
      )

      setPassword('')
    } catch (error) {
      if (
        error instanceof
        WriterLoginError
      ) {
        setErrorMessage(
          error.message,
        )
      } else {
        setErrorMessage(
          'No se pudo iniciar sesión.',
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="writer-auth-screen">
      <section className="writer-auth-card">
        <header className="writer-auth-heading">
          <span className="writer-auth-eyebrow">
            THE DARKEST ADVANCE
          </span>

          <h1>
            Writer
          </h1>

          <p>
            Inicia sesión para sincronizar y publicar.
            La sesión permanecerá guardada en este dispositivo.
          </p>
        </header>

        <form
          className="writer-auth-form"
          onSubmit={handleSubmit}
        >
          <label>
            <span>
              Usuario
            </span>

            <input
              type="text"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              disabled={submitting}
              onChange={(event) =>
                setUsername(
                  event.target.value,
                )
              }
              required
              autoFocus
            />
          </label>

          <label>
            <span>
              Contraseña
            </span>

            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              disabled={submitting}
              onChange={(event) =>
                setPassword(
                  event.target.value,
                )
              }
              required
            />
          </label>

          {errorMessage && (
            <p
              className="writer-auth-error"
              role="alert"
            >
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            className="writer-auth-submit"
            disabled={
              submitting
              || !username.trim()
              || !password
            }
          >
            {submitting
              ? 'Conectando…'
              : 'Iniciar sesión'}
          </button>
        </form>

        <p className="writer-auth-note">
          La contraseña se usa únicamente para autenticarte y no se guarda en el navegador.
        </p>
      </section>
    </main>
  )
}
