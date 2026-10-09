import {
  useRef,
} from 'react'

import type {
  PointerEvent as ReactPointerEvent,
} from 'react'

interface HorizontalSwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void

  minDistance?: number
  axisRatio?: number
}

interface SwipeStart {
  pointerId: number
  x: number
  y: number
}

const IGNORE_SWIPE_SELECTOR = [
  'input',
  'textarea',
  'select',
  '[contenteditable="true"]',
  '.chapter-drag-handle',
  '.mobile-item-context-menu',
  '.mobile-library-view-selector',
].join(',')

function shouldIgnoreSwipe(
  target: EventTarget | null,
) {
  if (
    !(target instanceof Element)
  ) {
    return false
  }

  return Boolean(
    target.closest(
      IGNORE_SWIPE_SELECTOR,
    ),
  )
}

export function useHorizontalSwipe({
  onSwipeLeft,
  onSwipeRight,

  minDistance = 64,
  axisRatio = 1.35,
}: HorizontalSwipeOptions) {
  const startRef =
    useRef<SwipeStart | null>(
      null,
    )

  const suppressClickUntilRef =
    useRef(0)

  function handlePointerDown(
    event:
      ReactPointerEvent<HTMLElement>,
  ) {
    if (
      event.pointerType !==
      'touch'
    ) {
      return
    }

    if (
      shouldIgnoreSwipe(
        event.target,
      )
    ) {
      return
    }

    startRef.current = {
      pointerId:
        event.pointerId,

      x:
        event.clientX,

      y:
        event.clientY,
    }

    try {
      event.currentTarget
        .setPointerCapture(
          event.pointerId,
        )
    } catch {
      // Algunos navegadores pueden
      // rechazar pointer capture.
    }
  }

  function handlePointerUp(
    event:
      ReactPointerEvent<HTMLElement>,
  ) {
    const start =
      startRef.current

    startRef.current =
      null

    if (
      !start ||
      start.pointerId !==
        event.pointerId
    ) {
      return
    }

    try {
      if (
        event.currentTarget
          .hasPointerCapture(
            event.pointerId,
          )
      ) {
        event.currentTarget
          .releasePointerCapture(
            event.pointerId,
          )
      }
    } catch {
      // Nada que limpiar.
    }

    const deltaX =
      event.clientX -
      start.x

    const deltaY =
      event.clientY -
      start.y

    const absoluteX =
      Math.abs(
        deltaX,
      )

    const absoluteY =
      Math.abs(
        deltaY,
      )

    /*
     * No fue suficientemente largo.
     */
    if (
      absoluteX <
      minDistance
    ) {
      return
    }

    /*
     * Evita interpretar como swipe
     * un scroll diagonal.
     */
    if (
      absoluteX <
      absoluteY *
        axisRatio
    ) {
      return
    }

    /*
     * Un swipe iniciado sobre un item
     * puede generar click al terminar.
     * Lo anulamos durante unos ms.
     */
    suppressClickUntilRef.current =
      performance.now() +
      350

    if (
      deltaX > 0
    ) {
      onSwipeRight?.()
      return
    }

    onSwipeLeft?.()
  }

  function handlePointerCancel(
    event:
      ReactPointerEvent<HTMLElement>,
  ) {
    if (
      startRef.current
        ?.pointerId ===
      event.pointerId
    ) {
      startRef.current =
        null
    }
  }

  function handleClickCapture(
    event:
      React.MouseEvent<HTMLElement>,
  ) {
    if (
      performance.now() >=
      suppressClickUntilRef.current
    ) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
  }

  return {
    onPointerDown:
      handlePointerDown,

    onPointerUp:
      handlePointerUp,

    onPointerCancel:
      handlePointerCancel,

    onClickCapture:
      handleClickCapture,
  }
}