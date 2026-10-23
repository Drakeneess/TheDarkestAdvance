import {
  hashWriterPassword,
} from './password-auth'

async function readPasswordFromStdin() {
  if (!process.stdin.isTTY) {
    let input = ''

    process.stdin.setEncoding(
      'utf8',
    )

    for await (
      const chunk
      of process.stdin
    ) {
      input += chunk
    }

    return input.replace(
      /\r?\n$/,
      '',
    )
  }

  return await new Promise<string>(
    (
      resolve,
      reject,
    ) => {
      let password = ''

      const cleanup = () => {
        process.stdin.setRawMode(
          false,
        )
        process.stdin.pause()
      }

      process.stdout.write(
        'Contraseña del Writer: ',
      )

      process.stdin.setRawMode(
        true,
      )
      process.stdin.resume()
      process.stdin.setEncoding(
        'utf8',
      )

      const onData =
        (chunk: string) => {
          if (
            chunk === '\u0003'
          ) {
            cleanup()
            process.stdout.write(
              '\n',
            )
            reject(
              new Error(
                'Operación cancelada',
              ),
            )
            return
          }

          if (
            chunk === '\r'
            || chunk === '\n'
          ) {
            process.stdin.off(
              'data',
              onData,
            )
            cleanup()
            process.stdout.write(
              '\n',
            )
            resolve(
              password,
            )
            return
          }

          if (
            chunk === '\u007f'
            || chunk === '\b'
          ) {
            if (
              password.length > 0
            ) {
              password =
                password.slice(
                  0,
                  -1,
                )

              process.stdout.write(
                '\b \b',
              )
            }

            return
          }

          password += chunk
          process.stdout.write(
            '*'.repeat(
              chunk.length,
            ),
          )
        }

      process.stdin.on(
        'data',
        onData,
      )
    },
  )
}

const password =
  await readPasswordFromStdin()

if (!password) {
  throw new Error(
    'La contraseña no puede estar vacía',
  )
}

process.stdout.write(
  `${hashWriterPassword(password)}\n`,
)
