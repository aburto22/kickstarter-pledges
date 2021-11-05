"use strict";

const w = 1250;
const h = 750;
const paddingX = 215;
const paddingTop = 30;
const paddingBottom = 105;

const svg = d3
  .select("main")
  .append("svg")
  .attr("width", w)
  .attr("height", h)
  .attr("viewBox", [0, 0, w, h]);

fetch(
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/kickstarter-funding-data.json"
)
  .then((res) => res.json())
  .then((json) => {
    const treemap = d3
      .treemap()
      .size([w - 2 * paddingX, h - paddingTop - paddingBottom])
      .padding(1);
    const root = treemap(
      d3
        .hierarchy(json)
        .sum((d) => d.value)
        .sort((a, b) => (a.value < b.value ? 1 : -1))
    );

    const values = json.children.map((obj) => {
      return obj.children.map((subObj) => subObj.value);
    });

    const maxVal = Math.max(...values.map((arr) => Math.max(...arr)));
    const minVal = Math.min(...values.map((arr) => Math.min(...arr)));

    const colorData = Array(10)
      .fill(1)
      .map((d, i, arr) => {
        const val = minVal + (i * (maxVal - minVal)) / (arr.length - 1);
        return (Math.round((val * 2) / 1000000) * 1000000) / 2;
      });

    const colorScale = d3
      .scaleLinear()
      .domain([minVal, maxVal])
      .range(["#348ad2", "#f5f9fd"]);

    function getColor(val) {
      let approxVal = 0;

      colorData.forEach((d) => {
        if (val >= d) approxVal = d;
      });

      return colorScale(approxVal);
    }

    function splitText(str, num = 8) {
      const strSplit = str.split(" ");
      const newArr = [];

      let tempStr = "";
      for (let i = 0; i < strSplit.length; i++) {
        if ((tempStr + strSplit[i]).length <= num) {
          tempStr += strSplit[i] + " ";
        } else {
          newArr.push(tempStr);
          tempStr = strSplit[i] + " ";
        }
      }

      newArr.push(tempStr);

      if (newArr[0] === "") newArr.shift();

      return newArr;
    }

    const leaf = svg
      .append("g")
      .attr("id", "tree-container")
      .attr("transform", `translate(${paddingX}, ${paddingTop})`)
      .selectAll("g")
      .data(root.leaves())
      .enter()
      .append("g")
      .attr("class", "leaf")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

    leaf
      .append("g")
      .attr("class", "tile")
      .on("mouseover", (e, d) => {
        const localData = splitText("Product: " + d.data.name, 30);

        localData.push(`Company: ${d.data.category}`);
        localData.push(
          `Pledged: $${new Intl.NumberFormat().format(d.data.value)}`
        );

        tooltip
          .style("display", "block")
          .selectAll("text")
          .data(localData)
          .join("text")
          .text((text) => text)
          .attr("id", (text, i) => `tooltip-${i}`)
          .attr("x", 10)
          .attr("y", (text, i) => 20 + 17 * i);
        //console.log(document.querySelector("#tooltip-0").getBBox());

        const maxWidth = d3.max(
          localData.map((val, i) =>
            Math.ceil(document.querySelector("#tooltip-" + i).getBBox().width)
          )
        );

        tooltip
          .select("rect")
          .attr("width", maxWidth + 25)
          .attr("height", localData.length * 17 + 14);
      })
      .on("mouseout", (e, d) => {
        tooltip.style("display", "none").selectAll("text").remove();
      })
      .append("rect")
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("fill", (d) => getColor(d.data.value))
      .attr("stroke", "rgba(50, 50, 50, 0.5)");

    console.log(root.leaves());

    d3.selectAll(".tile")
      .append("foreignObject")
      .style("transform", "translate(4, 14)")
      .attr("class", "div-text")
      .attr("height", (d) => d.y1 - d.y0)
      .attr("width", (d) => d.x1 - d.x0)
      .append("svg")
      .selectAll("text")
      .data((d) => splitText(d.data.name, 5))
      .join("text")
      .attr("font-size", "0.7rem")
      .text((d) => d)
      .attr("y", (d, i) => 10 + 10 * i)
      .attr("x", 2)
      .style("color", "black");

    const legend = svg
      .append("g")
      .attr("id", "legend")
      .attr(
        "transform",
        `translate(${paddingX + 250}, ${h - paddingBottom + 20})`
      );

    legend
      .selectAll("rect")
      .data(colorData.slice(0, colorData.length - 1))
      .join("rect")
      .attr("class", "legend-item")
      .attr("width", 40)
      .attr("height", 15)
      .attr("x", (d, i) => i * 40)
      .attr("fill", (d) => colorScale(d));

    legend
      .selectAll("text")
      .data(colorData)
      .join("text")
      .attr("x", (d, i) => i * 40)
      .attr("y", 30)
      .attr("transform", (d, i) => `rotate(45, ${i * 40}, 30)`)
      .text((d) => `$${new Intl.NumberFormat().format(d)}`);

    legend
      .selectAll("line")
      .data(colorData)
      .join("line")
      .attr("x1", (d, i) => i * 40)
      .attr("x2", (d, i) => i * 40)
      .attr("y1", 0)
      .attr("y2", 18)
      .attr("stroke", "rgba(50, 50, 50, 0.5)");

    legend
      .append("text")
      .text("Amount Pledged: ")
      .attr("x", -125)
      .attr("y", 13)
      .attr("font-weight", "bold");

    const tooltip = svg
      .append("g")
      .attr("id", "tooltip")
      .style("display", "none");

    tooltip
      .append("rect")
      .attr("width", 250)
      .attr("height", 65)
      .attr("rx", 10)
      .attr("ry", 10)
      .attr("fill", "rgba(255, 255, 255, 0.9)")
      .attr("stroke", "rgba(50, 50, 50, 0.5)");

    svg.on("mousemove", (e) => {
      const mouse = d3.pointer(e);

      tooltip.attr(
        "transform",
        `translate(${mouse[0] + 15}, ${mouse[1] - 30})`
      );
    });
  })
  .catch((err) => console.warn(err));
