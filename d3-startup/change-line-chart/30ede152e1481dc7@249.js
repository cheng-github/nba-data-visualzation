// https://observablehq.com/@d3/change-line-chart@249
export default function define(runtime, observer) {
  const main = runtime.module();
  const fileAttachments = new Map([["aapl.csv",new URL("./files/aapl.csv",import.meta.url)]]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], function(md){return(
md`# Change Line Chart

The variant of a [line chart](/@d3/line-chart) shows the change in price of Apple stock relative to its April 24, 2007 price of $93.24. The log *y*-scale allows [accurate comparison](/@mbostock/methods-of-comparison-compared).

Data: [Yahoo Finance](https://finance.yahoo.com/lookup)`
)});
  main.variable(observer("chart")).define("chart", ["d3","DOM","width","height","xAxis","yAxis","data","line"], function(d3,DOM,width,height,xAxis,yAxis,data,line)
{
  const svg = d3.select(DOM.svg(width, height));

  svg.append("g")
      .call(xAxis);

  svg.append("g")
      .call(yAxis);
  
  svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", line);
  
  return svg.node();
}
);
  main.variable(observer("height")).define("height", function(){return(
600
)});
  main.variable(observer("margin")).define("margin", function(){return(
{top: 20, right: 30, bottom: 30, left: 50}
)});
  main.variable(observer("x")).define("x", ["d3","data","margin","width"], function(d3,data,margin,width){return(
d3.scaleUtc()
    .domain(d3.extent(data, d => d.date))
    .range([margin.left, width - margin.right])
)});
  main.variable(observer("y")).define("y", ["d3","data","base","height","margin"], function(d3,data,base,height,margin){return(
d3.scaleLog()
    .domain([d3.min(data, d => d.value / base * 0.9), d3.max(data, d => d.value / base / 0.9)])
    .rangeRound([height - margin.bottom, margin.top])
)});
  main.variable(observer("xAxis")).define("xAxis", ["height","margin","d3","x","width"], function(height,margin,d3,x,width){return(
g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))
    .call(g => g.select(".domain").remove())
)});
  main.variable(observer("yAxis")).define("yAxis", ["margin","d3","y","format","width"], function(margin,d3,y,format,width){return(
g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y)
        .tickValues(d3.ticks(...y.domain(), 10))
        .tickFormat(format))
    .call(g => g.selectAll(".tick line").clone()
        .attr("stroke-opacity", d => d === 1 ? null : 0.2)
        .attr("x2", width - margin.left - margin.right))
    .call(g => g.select(".domain").remove())
)});
  main.variable(observer("format")).define("format", ["d3"], function(d3)
{
  const f = d3.format("+.0%");
  return x => x === 1 ? "0%" : f(x - 1);
}
);
  main.variable(observer("line")).define("line", ["d3","x","y","base"], function(d3,x,y,base){return(
d3.line()
    .x(d => x(d.date))
    .y(d => y(d.value / base))
)});
  main.variable(observer("data")).define("data", ["d3","FileAttachment"], async function(d3,FileAttachment){return(
Object.assign(d3.csvParse(await FileAttachment("aapl.csv").text(), d3.autoType).map(({date, close}) => ({date, value: close})), {y: "$ Close"})
)});
  main.variable(observer("base")).define("base", ["data"], function(data){return(
data[0].value
)});
  main.variable(observer("d3")).define("d3", ["require"], function(require){return(
require("d3@5")
)});
  return main;
}
