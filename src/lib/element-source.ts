import type { ElementInfo } from "element-source"
import { logger } from "@/lib/logger"

declare global {
  interface Window {
    __elementSourceInitialized?: boolean
    __elementSourceTooltip?: HTMLElement
  }
}

let resolver: {
  resolveElementInfo: (node: object) => Promise<ElementInfo>
} | null = null

let currentTarget: Element | null = null
let isAltPressed = false
let hoverTimeout: ReturnType<typeof setTimeout> | null = null

function getOrCreateTooltip(): HTMLElement {
  if (window.__elementSourceTooltip) {
    return window.__elementSourceTooltip
  }

  const tooltip = document.createElement("div")
  tooltip.id = "element-source-tooltip"
  tooltip.style.cssText = `
    position: fixed;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-family: monospace;
    font-size: 12px;
    line-height: 1.4;
    pointer-events: none;
    z-index: 999999;
    max-width: 400px;
    word-break: break-all;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    border: 1px solid #3b82f6;
    display: none;
  `
  document.body.appendChild(tooltip)
  window.__elementSourceTooltip = tooltip
  return tooltip
}

function showTooltip(element: Element, info: ElementInfo) {
  const tooltip = getOrCreateTooltip()

  if (!info.source) {
    tooltip.innerHTML = `
      <div style="color: #9ca3af;">No source info</div>
      <div style="color: #6b7280; font-size: 10px; margin-top: 4px;">
        ${info.tagName}
      </div>
    `
  } else {
    const { filePath, lineNumber, columnNumber, componentName } = info.source
    const shortPath = filePath.replace(/^.*\//, "")
    const displayPath =
      filePath.length > 50 ? `...${filePath.slice(-47)}` : filePath

    tooltip.innerHTML = `
      <div style="color: #3b82f6; font-weight: 600; margin-bottom: 4px;">
        ${componentName || shortPath}
      </div>
      <div style="color: #d1d5db; font-size: 11px;">
        ${displayPath}:${lineNumber ?? 1}:${columnNumber ?? 1}
      </div>
      <div style="color: #6b7280; font-size: 10px; margin-top: 6px; padding-top: 6px; border-top: 1px solid #374151;">
        Alt+Click to copy
      </div>
    `
  }

  tooltip.style.display = "block"

  const rect = element.getBoundingClientRect()
  const tooltipRect = tooltip.getBoundingClientRect()

  let top = rect.bottom + 8
  let left = rect.left

  if (top + tooltipRect.height > window.innerHeight) {
    top = rect.top - tooltipRect.height - 8
  }

  if (left + tooltipRect.width > window.innerWidth) {
    left = window.innerWidth - tooltipRect.width - 8
  }

  tooltip.style.top = `${top}px`
  tooltip.style.left = `${left}px`
}

function hideTooltip() {
  const tooltip = window.__elementSourceTooltip
  if (tooltip) {
    tooltip.style.display = "none"
  }
}

function showCopiedFeedback(path: string) {
  const tooltip = getOrCreateTooltip()
  tooltip.innerHTML = `
    <div style="color: #22c55e; font-weight: 600;">✓ Copied to clipboard!</div>
    <div style="color: #9ca3af; font-size: 11px; margin-top: 4px;">
      ${path.replace(/^.*\//, "")}
    </div>
  `

  setTimeout(() => {
    hideTooltip()
  }, 1500)
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    logger.info(`Copied to clipboard: ${text}`)
    return true
  } catch (error) {
    logger.error(error, "Failed to copy to clipboard")
    return false
  }
}

async function resolveAndShowTooltip(target: Element) {
  if (!resolver || !isAltPressed) return

  try {
    const info = await resolver.resolveElementInfo(target)
    if (currentTarget === target && isAltPressed) {
      showTooltip(target, info)
    }
  } catch (error) {
    logger.error(error, "Failed to resolve element")
  }
}

function handleMouseOver(event: MouseEvent) {
  if (!isAltPressed) return

  const target = event.target as Element
  if (!target || target === currentTarget) return

  currentTarget = target
  target.setAttribute("data-element-source-hover", "true")

  if (hoverTimeout) {
    clearTimeout(hoverTimeout)
  }

  hoverTimeout = setTimeout(() => {
    void resolveAndShowTooltip(target)
  }, 100)
}

function handleMouseOut(event: MouseEvent) {
  const target = event.target as Element
  if (!target) return

  target.removeAttribute("data-element-source-hover")

  if (currentTarget === target) {
    currentTarget = null
    hideTooltip()
  }

  if (hoverTimeout) {
    clearTimeout(hoverTimeout)
    hoverTimeout = null
  }
}

async function handleClick(event: MouseEvent) {
  if (!isAltPressed || !currentTarget || !resolver) return

  event.preventDefault()
  event.stopPropagation()

  try {
    const info = await resolver.resolveElementInfo(currentTarget)
    if (!info.source) {
      logger.warn("Could not resolve element source")
      return
    }

    const { filePath, lineNumber, columnNumber } = info.source
    const line = lineNumber ?? 1
    const col = columnNumber ?? 1
    const pathWithLine = `${filePath}:${line}:${col}`

    const copied = await copyToClipboard(pathWithLine)
    if (copied) {
      showCopiedFeedback(filePath)
    }
  } catch (error) {
    logger.error(error, "Failed to resolve element")
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === "Alt" && !isAltPressed) {
    isAltPressed = true
    document.body.style.cursor = "crosshair"
  }
}

function handleKeyUp(event: KeyboardEvent) {
  if (event.key === "Alt" && isAltPressed) {
    isAltPressed = false
    document.body.style.cursor = ""

    if (currentTarget) {
      currentTarget.removeAttribute("data-element-source-hover")
      currentTarget = null
    }

    hideTooltip()

    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      hoverTimeout = null
    }
  }
}

export async function initElementSource() {
  if (typeof window === "undefined") return
  if (!import.meta.env.DEV) return
  if (window.__elementSourceInitialized) return

  try {
    const { createSourceResolver, svelteResolver } = await import(
      "element-source"
    )

    resolver = createSourceResolver({ resolvers: [svelteResolver] })

    document.addEventListener("mouseover", handleMouseOver, true)
    document.addEventListener("mouseout", handleMouseOut, true)
    document.addEventListener("click", handleClick, true)
    document.addEventListener("keydown", handleKeyDown, true)
    document.addEventListener("keyup", handleKeyUp, true)

    window.__elementSourceInitialized = true
    logger.info("Element source initialized (development only)")
  } catch (error) {
    logger.error(error, "Failed to initialize element source")
  }
}

export function destroyElementSource() {
  if (typeof window === "undefined") return

  document.removeEventListener("mouseover", handleMouseOver, true)
  document.removeEventListener("mouseout", handleMouseOut, true)
  document.removeEventListener("click", handleClick, true)
  document.removeEventListener("keydown", handleKeyDown, true)
  document.removeEventListener("keyup", handleKeyUp, true)

  hideTooltip()

  if (window.__elementSourceTooltip) {
    window.__elementSourceTooltip.remove()
    window.__elementSourceTooltip = undefined
  }

  window.__elementSourceInitialized = false
  resolver = null
  currentTarget = null
  isAltPressed = false

  if (hoverTimeout) {
    clearTimeout(hoverTimeout)
    hoverTimeout = null
  }
}
