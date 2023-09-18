import React, { useEffect, useRef } from 'react';
import useSVGCanvas from './useSVGCanvas.js';
import * as d3 from 'd3';

export default function GunDeathsChart(props) {
    const d3Container = useRef(null);
    const [svg, height, width, tTip] = useSVGCanvas(d3Container);

    const margin = { top: 50, right: 50, bottom: 50, left: 50 };

    useEffect(() => {
        if (svg === undefined || props.data === undefined) {
            return;
        }

        // Convert data to deaths per 100,000 population for males and females
        const data = props.data.states.map((stateData) => {
            const count = stateData.count;
            const population = parseFloat(stateData.population);
            const maleDeathsPer100k = (stateData.male_count / population) * 100000;
            const femaleDeathsPer100k = ((stateData.count - stateData.male_count) / population) * 100000;
            const maleDeaths = stateData.male_count;
            const femaleDeaths = stateData.count - stateData.male_count
            return {
                name: stateData.abreviation,
                nameState: stateData.state.split("_").pop(),
                maleDeathsPer100k,
                femaleDeathsPer100k,
                population,
                count,
                maleDeaths,
                femaleDeaths
            };
        });

        const xScale = d3
            .scaleBand()
            .domain(data.map((d) => d.name))
            .range([50, width - 1])
            .padding(0.2);

        const yScale = d3
            .scaleLinear()
            .domain([0, d3.max(data, (d) => Math.max(d.maleDeathsPer100k, d.femaleDeathsPer100k))])
            .nice()
            .range([height - margin.bottom, margin.top]);

        svg.selectAll('.bar-male')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'bar-male')
            .attr('x', (d) => xScale(d.name))
            .attr('y', (d) => yScale(d.maleDeathsPer100k))
            .attr('width', xScale.bandwidth() / 2) 
            .attr('height', (d) => height - margin.bottom - yScale(d.maleDeathsPer100k))
            .attr('fill', 'steelblue')
            .on('mouseover', (e, d) => {
                const tooltipText = d.nameState + '</br>' + 'Gun Deaths:'
                    + d.count + '</br>' + 'population:'
                    + d.population + '</br>' + "Male :" + d.maleDeaths +
                    '</br>' +
                    "(Male):" +
                    d.maleDeathsPer100k.toFixed(2)
                    + 'Deaths per 100,000';
                props.ToolTip.moveTTipEvent(tTip, e);
                tTip.html(tooltipText);
            })
            .on('mousemove', (e) => {
                props.ToolTip.moveTTipEvent(tTip, e);
            })
            .on('mouseout', () => {
                props.ToolTip.hideTTip(tTip);
            });

        svg.selectAll('.bar-female')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'bar-female')
            .attr('x', (d) => xScale(d.name) + xScale.bandwidth() / 2) // Second half of the bandwidth
            .attr('y', (d) => yScale(d.femaleDeathsPer100k))
            .attr('width', xScale.bandwidth() / 2) // Half of the bandwidth
            .attr('height', (d) => height - margin.bottom - yScale(d.femaleDeathsPer100k))
            .attr('fill', 'red')
            .on('mouseover', (e, d) => {
                const tooltipText = d.nameState + '</br>' + 'Gun Deaths:'
                    + d.count + '</br>' + 'population:'
                    + d.population + '</br>' + "Female :" + d.femaleDeaths +
                    '</br>' +
                    "(Female):" +
                    d.femaleDeathsPer100k.toFixed(2)
                    + 'Deaths per 100,000';
                props.ToolTip.moveTTipEvent(tTip, e);
                tTip.html(tooltipText);
            })
            .on('mousemove', (e) => {
                props.ToolTip.moveTTipEvent(tTip, e);
            })
            .on('mouseout', () => {
                props.ToolTip.hideTTip(tTip);
            });

        svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .style('text-anchor', 'middle');

        svg.append('g')
            .attr('class', 'y-axis')
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(yScale));

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', margin.top / 2)
            .attr('text-anchor', 'middle')
            .attr('font-size', 20)
            .attr('font-weight', 'bold')
            .text('Gun Deaths per 100,000 Population by State (Male and Female)');

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height - 10)
            .attr('text-anchor', 'middle')
            .text('State');

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', margin.left / 2 - 10)
            .attr('text-anchor', 'middle')
            .text('Deaths per 100,000 Population');

    }, [props.data, svg]);

    return (
        <div className={"d3-component"} style={{ 'height': '100%', 'width': '100%' }} ref={d3Container}></div>
    );
}
