const fixLinkCss = (svg) => {
  const css = 'svg-hover:hover { background-color: rgba(0,0,0,0.1); }'
  const style = svg.createElementNS('http://www.w3.org/2000/svg', 'style')

  style.textContent = css
  svg.getElementsByTagName('svg')[0].appendChild(style)
}

const fixLinkTargets = (svg) => {
  const links = svg.getElementsByTagName('a')
  for (const link of links) {
    link.setAttribute('target', '_top')
    link.setAttribute('class', 'svg-hover')
  }
}

document.addEventListener('DOMContentLoaded', (event) => {
  const svgs = document.getElementsByClassName('svg-hoverable')
  for (const svg of svgs) {
    svg.addEventListener('load', () => {
      fixLinkTargets(svg.contentDocument)
      fixLinkCss(svg.contentDocument)
    })
  }
})

