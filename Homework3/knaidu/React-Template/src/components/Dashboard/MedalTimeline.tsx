// src/components/Dashboard/MedalTimeline.tsx
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ComponentSize, Margin } from '../../types';

interface MedalTimelineProps {
  data: any[];
  size: ComponentSize;
  margin: Margin;
  selectedCountry: string | null;
}

export default function MedalTimeline({ data, size, margin, selectedCountry }: MedalTimelineProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;
    if (size.width === 0 || size.height === 0) return;

    const width = size.width - margin.left - margin.right;
    const height = size.height - margin.top - margin.bottom;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr('width', size.width)
      .attr('height', size.height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Process data for selected country or all countries
    const timelineData = selectedCountry 
      ? [data.find(d => d.country === selectedCountry)].filter(Boolean)
      : data;

    // Create scales
    const xScale = d3.scalePoint()
      .domain(['Gold Medal', 'Silver Medal', 'Bronze Medal'])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(timelineData, d => Math.max(d['Gold Medal'], d['Silver Medal'], d['Bronze Medal'])) || 0])
      .range([height, 0]);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    g.append('g')
      .call(d3.axisLeft(yScale));

    // Add lines
    const line = d3.line()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]));

    // Add lines for each country
    timelineData.forEach(country => {
      const countryData = [
        ['Gold Medal', country['Gold Medal']],
        ['Silver Medal', country['Silver Medal']],
        ['Bronze Medal', country['Bronze Medal']]
      ];

      g.append('path')
        .datum(countryData)
        .attr('fill', 'none')
        .attr('stroke', selectedCountry ? '#2196f3' : '#ccc')
        .attr('stroke-width', selectedCountry ? 3 : 1)
        .attr('d', line);

      // Add points
      g.selectAll('.point')
        .data(countryData)
        .join('circle')
        .attr('cx', d => xScale(d[0]))
        .attr('cy', d => yScale(d[1]))
        .attr('r', 5)
        .attr('fill', selectedCountry ? '#2196f3' : '#ccc');
    });

    // Add title
    svg.append('text')
      .attr('x', size.width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text(selectedCountry ? `${selectedCountry} Medal Distribution` : 'Overall Medal Distribution');

  }, [data, size, selectedCountry]);

  return <svg ref={svgRef} />;
}