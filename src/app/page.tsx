'use client'
import { useEffect, useRef } from 'react';
import {Map} from 'mapbox-gl';

import 'mapbox-gl/dist/mapbox-gl.css';

export default function Home() {
  const mapRef = useRef<Map>(undefined);
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(()=> {
    mapRef.current = new Map({
      container: mapContainer.current || '',
      center: [-97.1766223819563, 32.70097504372159], // starting position [lng, lat]
      zoom: 10,
      style: 'mapbox://styles/ktbartholomew/cm95uquvl00b901qu1d9kf3lj',
    })
  }, [])


  return (
    <div className='w-[100vw] h-[100vh]'>
      <div style={{height: '100%'}} className='map-container' ref={mapContainer}></div>
    </div>
  );
}
