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
      fixLinkTargets(svg)
    })
  }
})

