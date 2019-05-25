const fixLinkCss = (svg) => {
  const css = 'svg-hover:hover { background-color: rgba(0,0,0,0.1); }'
  const style = svg.createElement('style')
  
  svg.appendChild(style)
  style.type = 'text/css'
  style.innerHTML = css
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

