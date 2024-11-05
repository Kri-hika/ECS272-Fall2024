// src/components/Dashboard/MedalDashboard.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { isEmpty } from 'lodash';
import { ComponentSize, Margin } from '../types';
import './Dashboard.css'; // We'll create this CSS file

export interface MedalData {
  country_code: string;
  country: string;
  country_long: string;
  "Gold Medal": number;
  "Silver Medal": number;
  "Bronze Medal": number;
  Total: number;
}

const MedalDashboard: React.FC = () => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 800, height: 600 }); // Set default size
  const [medalData, setMedalData] = useState<MedalData[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'timeline'>('map');
  const margin: Margin = { top: 40, right: 20, bottom: 40, left: 60 };

  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200);
  useResizeObserver({ ref: dashboardRef, onResize });

  // Load GeoJSON directly
  const geoJsonUrl = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson';

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load both datasets
        const [medalResponse, worldResponse] = await Promise.all([
          fetch('/data/medals_total.csv'),
          fetch(geoJsonUrl)
        ]);

        if (!medalResponse.ok || !worldResponse.ok) {
          throw new Error('Failed to load data');
        }

        const medalText = await medalResponse.text();
        const worldData = await worldResponse.json();

        // Parse CSV data
        const processedMedalData = d3.csvParse(medalText, d => ({
          country_code: d.country_code,
          country: d.country,
          country_long: d.country_long,
          "Gold Medal": +(d["Gold Medal"] || 0),
          "Silver Medal": +(d["Silver Medal"] || 0),
          "Bronze Medal": +(d["Bronze Medal"] || 0),
          Total: +(d.Total || 0)
        })) as MedalData[];

        console.log('Processed Medal Data:', processedMedalData); // Debug log
        setMedalData(processedMedalData);
        
        // Initialize map with the loaded data
        if (mapRef.current) {
          initMap(processedMedalData, worldData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Re-initialize map when size changes
  useEffect(() => {
    if (medalData.length > 0 && mapRef.current) {
      const loadWorldData = async () => {
        const worldResponse = await fetch(geoJsonUrl);
        const worldData = await worldResponse.json();
        initMap(medalData, worldData);
      };
      loadWorldData();
    }
  }, [size]);

  const initMap = (data: MedalData[], worldGeoJson: any) => {
    if (!mapRef.current || isEmpty(data)) return;

    console.log('Initializing map with data:', data); // Debug log

    const width = size.width - margin.left - margin.right;
    const height = size.height - margin.top - margin.bottom;

    // Clear previous content
    d3.select(mapRef.current).selectAll("*").remove();

    // Create SVG
    const svg = d3.select(mapRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create map container with margin
    const mapContainer = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create color scale
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, d3.max(data, d => d.Total) || 0]);

    // Create projection
    const projection = d3.geoMercator()
      .fitSize([width, height], worldGeoJson);

    const path = d3.geoPath().projection(projection);

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'medal-tooltip')
      .style('opacity', 0);

    // Draw map
    mapContainer.selectAll('path')
      .data(worldGeoJson.features)
      .join('path')
      .attr('class', 'country')
      .attr('d', path)
      .attr('fill', d => {
        const countryData = data.find(m => m.country_code === d.properties.ISO_A3);
        return countryData ? colorScale(countryData.Total) : '#eee';
      })
      .on('mouseover', (event, d) => {
        const countryData = data.find(m => m.country_code === d.properties.ISO_A3);
        if (countryData) {
          tooltip.transition()
            .duration(200)
            .style('opacity', .9);
          tooltip.html(`
            <strong>${countryData.country}</strong><br/>
            Gold: ${countryData["Gold Medal"]}<br/>
            Silver: ${countryData["Silver Medal"]}<br/>
            Bronze: ${countryData["Bronze Medal"]}<br/>
            Total: ${countryData.Total}
          `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        }
      })
      .on('mouseout', () => {
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });

    // Add legend
    const legendWidth = 200;
    const legendHeight = 10;
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - legendWidth - margin.right}, ${height - 20})`);

    // Create gradient
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'medal-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%')
      .attr('y1', '0%')
      .attr('y2', '0%');

    gradient.selectAll('stop')
      .data(d3.range(0, 1.1, 0.1))
      .join('stop')
      .attr('offset', d => `${d * 100}%`)
      .attr('stop-color', d => colorScale(d * colorScale.domain()[1]));

    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#medal-gradient)');

    // Add legend axis
    const legendScale = d3.scaleLinear()
      .domain(colorScale.domain())
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5);

    legend.append('g')
      .attr('transform', `translate(0,${legendHeight})`)
      .call(legendAxis);
  };

  return (
    <div className="dashboard-container" ref={dashboardRef}>
      <h1 className="dashboard-title">Olympic Medals Dashboard</h1>
      <h2 className="dashboard-subtitle">Paris 2024 Olympic Games Medal Tracker</h2>
      
      <div className="view-controls">
        <button 
          className={`view-button ${viewMode === 'map' ? 'active' : ''}`}
          onClick={() => setViewMode('map')}
        >
          Map View
        </button>
        <button 
          className={`view-button ${viewMode === 'timeline' ? 'active' : ''}`}
          onClick={() => setViewMode('timeline')}
        >
          Timeline View
        </button>
      </div>

      <div className="map-container">
        <svg ref={mapRef} />
      </div>
    </div>
  );
};

export default MedalDashboard;