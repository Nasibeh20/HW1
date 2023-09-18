import React, { useRef, useMemo } from 'react';
import useSVGCanvas from './useSVGCanvas.js';
import * as d3 from 'd3';

export default function Whitehat(props) {
    const d3Container = useRef(null);
    const [svg, height, width, tTip] = useSVGCanvas(d3Container);
    var isZoomed = false;
    const maxRadius = width / 70;
    const projection = d3.geoAlbersUsa()
        .translate([width / 2, height / 2]);

    const geoGenerator = d3.geoPath().projection(projection);

    function cleanString(string) {
        return string.replace(' ', '_').replace(' ', '_');
    }

    const mapGroupSelection = useMemo(() => {
        if (svg !== undefined && props.map !== undefined && props.data !== undefined) {
            let populationState = '';
            let SCount = '';
            const stateData = props.data.states;

            const getEncodedFeature = d => d.count;

            const stateCounts = Object.values(stateData).map(getEncodedFeature);
            const [stateMin, stateMax] = d3.extent(stateCounts);
            const stateScale = d3.scaleLinear()
                .domain([stateMin, stateMax])
                .range([1, 0]);

            const colorMap = d3.interpolateRdYlGn;
            const colorScale = d3.scaleSequential(d3.interpolateRdYlGn)
                .domain([0, 100000]);

            function getCount(name) {
                name = cleanString(name);
                let entry = stateData.filter(d => d.state === name);
                if (entry === undefined || entry.length < 1) {
                    return 0;
                }
                populationState = entry[0].population;
                SCount = entry[0].count;
                return getEncodedFeature(entry[0]);
            }

            function getStateColor(name) {
                name = cleanString(name);
                let entry = stateData.filter(d => d.state === name);
                if (entry === undefined || entry.length < 1) {
                    return 0;
                }
                return colorScale(entry[0].population / entry[0].count);
            }

            svg.selectAll('g').remove();

            let mapGroup = svg.append('g').attr('class', 'mapbox');
            mapGroup.selectAll('path').filter('.state')
                .data(props.map.features).enter()
                .append('path').attr('class', 'state')
                .attr('id', d => cleanString(d.properties.NAME))
                .attr('d', geoGenerator)
                .attr('fill', d => getStateColor(d.properties.NAME))
                .attr('stroke', 'black')
                .attr('stroke-width', 0.5)
                .on('mouseover', (e, d) => {
                    let state = cleanString(d.properties.NAME);
                    if (props.brushedState !== state) {
                        props.setBrushedState(state);
                    }
                    let sname = d.properties.NAME;
                    let count = getCount(sname);
                    let text = sname + '</br>'
                        + 'Gun Deaths: ' + count
                        + '</br>' + 'Population: ' + populationState;
                    tTip.html(text);
                }).on('mousemove', (e) => {
                    props.ToolTip.moveTTipEvent(tTip, e);
                }).on('mouseout', (e, d) => {
                    props.setBrushedState();
                    props.ToolTip.hideTTip(tTip);
                });

            const cityData = props.data.cities;
            const cityMax = d3.max(cityData.map(d => d.count));
            const cityScale = d3.scaleLinear()
                .domain([0, cityMax])
                .range([1.5, maxRadius]);

            mapGroup.selectAll('.city').remove();

            mapGroup.selectAll('.city')
                .data(cityData).enter()
                .append('circle').attr('class', 'city')
                .attr('id', d => d.key)
                .attr('cx', d => projection([d.lng, d.lat])[0])
                .attr('cy', d => projection([d.lng, d.lat])[1])
                .attr('r', d => cityScale(d.count))
                // .attr('fill', 'black')
                .attr('opacity', 0.4)
                .on('mouseover', (e, d) => {
                    let cityName = d.city;
                    let count = d.count;
                    let text = cityName + '</br>' + 'City Count: ' + count;
                    tTip.html(text);
                }).on('mousemove', (e) => {
                    props.ToolTip.moveTTipEvent(tTip, e);
                }).on('mouseout', (e, d) => {
                    props.ToolTip.hideTTip(tTip);
                });

            function drawLegend() {
                let bounds = mapGroup.node().getBBox();
                const barHeight = Math.min(height / 15, 40);

                let legendX = bounds.x + 9 + bounds.width;
                const barWidth = Math.min((width - legendX) / 3, 40);
                const fontHeight = Math.min(barWidth / 2, 16);
                let legendY = bounds.y + 10 * fontHeight;

                let colorLData = [];
                for (let ratio of [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.99]) {
                    let val = (1 - ratio) * stateMin + ratio * stateMax;
                    let scaledVal = stateScale(val);
                    let color = colorMap(scaledVal);
                    let entry = {
                        'x': legendX,
                        'y': legendY,
                        'color': color,
                    }
                    colorLData.push(entry);
                    legendY += barHeight;
                }

                svg.selectAll('.legendRect').remove();
                svg.selectAll('.legendRect')
                    .data(colorLData).enter()
                    .append('rect').attr('class', 'legendRect')
                    .attr('x', d => d.x)
                    .attr('y', d => d.y)
                    .attr('fill', d => d.color)
                    .attr('height', barHeight)
                    .attr('width', 20);

                svg.selectAll('.legendText').remove();
                const legendTitle = {
                    'x': legendX - barWidth - 7,
                    'y': legendY + 10,
                    'text': '<10 per 100K'
                }
                
                const legendFirstTitle = {
                    'x': legendX - barWidth - 7,
                    'y': legendY - barWidth - 180,
                    'text': '>2 per 100K'
                }
                const legendBannerTitle = {
                    'x': legendX - barWidth - 15,
                    'y': legendY - barWidth - 205,
                    'text': 'rate (per 100000 people)'
                }

                svg.selectAll('.legendText')
                    .data([legendTitle, legendFirstTitle, legendBannerTitle].concat(colorLData)).enter()
                    .append('text').attr('class', 'legendText')
                    .attr('x', d => d.x + barWidth + 5)
                    .attr('y', d => d.y + barHeight / 2 + fontHeight / 4)
                    .attr('font-size', (d, i) => i == 0 ? 1 * fontHeight : fontHeight)
                    .text(d => d.text);
            }

            drawLegend();
            return mapGroup;
        }
    }, [svg, props.map, props.data]);

    useMemo(() => {
        if (mapGroupSelection === undefined) { return; }

        function zoomed(event) {
            const { transform } = event;
            mapGroupSelection
                .attr("transform", transform)
                .attr("stroke-width", 1 / transform.k);
        }

        const zoom = d3.zoom()
            .on("zoom", zoomed);

        function clicked(event, d) {
            event.stopPropagation();
            if (isZoomed) {
                mapGroupSelection.transition().duration(300).call(
                    zoom.transform,
                    d3.zoomIdentity.translate(0, 0),
                    d3.pointer(event, svg.node())
                );
            }
            else {
                const [[x0, y0], [x1, y1]] = geoGenerator.bounds(d);
                mapGroupSelection.transition().duration(750).call(
                    zoom.transform,
                    d3.zoomIdentity
                        .translate(width / 2, height / 2)
                        .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
                        .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
                    d3.pointer(event, svg.node())
                );
            }
            isZoomed = !isZoomed;
            if (isZoomed) {
                props.setZoomedState(d.properties.NAME);
            } else {
                props.setZoomedState(undefined);
            }
        }

        mapGroupSelection.selectAll('.state').attr('cursor', 'pointer')
            .on('click', clicked);

    }, [mapGroupSelection]);

    useMemo(() => {
        if (mapGroupSelection !== undefined) {
            const isBrushed = props.brushedState !== undefined;
            mapGroupSelection.selectAll('.state')
                .attr('opacity', isBrushed ? 0.4 : 0.8)
                .attr('strokeWidth', isBrushed ? 1 : 2);
            if (isBrushed) {
                mapGroupSelection.select('#' + props.brushedState)
                    .attr('opacity', 1)
                    .attr('strokeWidth', 3);
            }
        }
    }, [mapGroupSelection, props.brushedState]);

    return (
        <div
            className={"d3-component"}
            style={{ 'height': '99%', 'width': '99%' }}
            ref={d3Container}
        ></div>
    );
}