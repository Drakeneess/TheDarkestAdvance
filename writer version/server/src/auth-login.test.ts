import assert from 'node:assert/strict'
import test from 'node:test'

import Fastify from 'fastify'

import {
  authRoutes,
} from './auth-routes'

import {
  hashWriterPassword,
  verifyWriterPassword,
} from './password-auth'

const TEST_USER_ID =
  'writer-login-test-user'

const TEST_PASSWORD =
  'Writer login test password 2026'

const TEST_TOKEN =
  'writer-login-test-token-0000000000000000000000'

test(
  'password hash roundtrip',
  () => {
    const hash =
      hashWriterPassword(
        TEST_PASSWORD,
      )

    assert.equal(
      verifyWriterPassword(
        TEST_PASSWORD,
        hash,
      ),
      true,
    )

    assert.equal(
      verifyWriterPassword(
        'wrong password',
        hash,
      ),
      false,
    )
  },
)

test(
  'Writer credential login',
  async (t) => {
    const previousTokens =
      process.env.WRITER_AUTH_TOKENS

    const previousHashes =
      process.env.WRITER_AUTH_PASSWORD_HASHES

    process.env.WRITER_AUTH_TOKENS =
      JSON.stringify({
        [TEST_USER_ID]:
          TEST_TOKEN,
      })

    process.env.WRITER_AUTH_PASSWORD_HASHES =
      JSON.stringify({
        [TEST_USER_ID]:
          hashWriterPassword(
            TEST_PASSWORD,
          ),
      })

    const app =
      Fastify({
        logger: false,
      })

    await app.register(
      authRoutes,
    )

    t.after(
      async () => {
        await app.close()

        if (
          previousTokens ===
          undefined
        ) {
          delete process.env
            .WRITER_AUTH_TOKENS
        } else {
          process.env.WRITER_AUTH_TOKENS =
            previousTokens
        }

        if (
          previousHashes ===
          undefined
        ) {
          delete process.env
            .WRITER_AUTH_PASSWORD_HASHES
        } else {
          process.env.WRITER_AUTH_PASSWORD_HASHES =
            previousHashes
        }
      },
    )

    await t.test(
      'returns the configured bearer token for valid credentials',
      async () => {
        const response =
          await app.inject({
            method: 'POST',
            url:
              '/api/auth/login',
            payload: {
              username:
                TEST_USER_ID,
              password:
                TEST_PASSWORD,
            },
          })

        assert.equal(
          response.statusCode,
          200,
        )

        assert.deepEqual(
          response.json(),
          {
            userId:
              TEST_USER_ID,
            token:
              TEST_TOKEN,
          },
        )
      },
    )

    await t.test(
      'rejects an invalid password without leaking user details',
      async () => {
        const response =
          await app.inject({
            method: 'POST',
            url:
              '/api/auth/login',
            payload: {
              username:
                TEST_USER_ID,
              password:
                'definitely-wrong',
            },
          })

        assert.equal(
          response.statusCode,
          401,
        )

        assert.deepEqual(
          response.json(),
          {
            error:
              'INVALID_CREDENTIALS',
          },
        )
      },
    )

    await t.test(
      'rejects an unknown user with the same public error',
      async () => {
        const response =
          await app.inject({
            method: 'POST',
            url:
              '/api/auth/login',
            payload: {
              username:
                'unknown-user',
              password:
                TEST_PASSWORD,
            },
          })

        assert.equal(
          response.statusCode,
          401,
        )

        assert.deepEqual(
          response.json(),
          {
            error:
              'INVALID_CREDENTIALS',
          },
        )
      },
    )

    await t.test(
      'rejects malformed login payloads',
      async () => {
        const response =
          await app.inject({
            method: 'POST',
            url:
              '/api/auth/login',
            payload: {
              username: '',
              password: '',
            },
          })

        assert.equal(
          response.statusCode,
          400,
        )

        assert.deepEqual(
          response.json(),
          {
            error:
              'INVALID_LOGIN_REQUEST',
          },
        )
      },
    )
  },
)
