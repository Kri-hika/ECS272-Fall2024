import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { isEmpty } from 'lodash';
import { ComponentSize, Margin } from '../../types';
import { ProcessedData, processMedalData } from './DataProcessor';

export default function MedalDashboard() {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const [data, setData] = useState<ProcessedData | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const margin: Margin = { top: 40, right: 20, bottom: 40, left: 60 };
  
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200);
  useResizeObserver({ ref: dashboardRef, onResize });

  useEffect(() => {
    const svgMap = d3.select('#map-container')
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%');

    const svgChart = d3.select('#chart-container')
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%');

    const svgDetails = d3.select('#details-container')
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%');

    return () => {
      svgMap.remove();
      svgChart.remove();
      svgDetails.remove();
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (isEmpty(data)) {
        try {
          const totalResponse = await fetch('/data/medals_total.csv');
          const detailedResponse = await fetch('/data/medals.csv');
          
          const totalText = await totalResponse.text();
          const detailedText = await detailedResponse.text();
          
          const processedData = await processMedalData(totalText, detailedText);
          setData(processedData);
        } catch (error) {
          console.error('Error loading data:', error);
        }
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!data || size.width === 0 || size.height === 0) return;
    
    // Clear existing visualizations
    d3.selectAll('svg > *').remove();
    
    initializeVisualizations();
  }, [data, size, selectedCountry]);

  const initializeVisualizations = () => {
    // Clear existing visualizations
    d3.selectAll('svg > *').remove();
    
    const mapContainer = d3.select('#map-container')
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%');

    const chartContainer = d3.select('#chart-container')
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%');

    const detailsContainer = d3.select('#details-container')
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%');

    // Initialize each visualization...
    initMap(mapContainer);
    initMedalChart(chartContainer);
    initCountryDetails(detailsContainer);
  };

  const initMap = (container: d3.Selection<SVGSVGElement | null, unknown, null, undefined>) => {
    if (!data) return;
    const svg = d3.select('#map-container svg');
    // Map visualization code here
  };

  const initMedalChart = (container: d3.Selection<SVGSVGElement | null, unknown, null, undefined>) => {
    if (!data) return;
    const svg = d3.select('#chart-container svg');
    // Medal chart visualization code here
  };

  const initCountryDetails = (container: d3.Selection<SVGSVGElement | null, unknown, null, undefined>) => {
    if (!data) return;
    const svg = d3.select('#details-container svg');
    // Country details visualization code here
  };


  return (
    <div ref={dashboardRef} className="chart-container">
      <div className="visualization-grid" style={{
        display: 'grid',
        gridTemplateRows: '1fr 1fr',
        gap: '1rem',
        height: '100%',
        padding: '1rem'
      }}>
        <div id="map-container" style={{ width: '100%', height: '100%' }}></div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem'
        }}>
          <div id="chart-container" style={{ width: '100%', height: '100%' }}></div>
          <div id="details-container" style={{ width: '100%', height: '100%' }}></div>
        </div>
      </div>
    </div>
  );
}