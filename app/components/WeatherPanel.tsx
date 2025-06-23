'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const WeatherPanel = () => {
  const [weather, setWeather] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchWeather = async () => {
      const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
      if (!apiKey) {
        setError('API 키가 설정되지 않았습니다. .env 파일을 확인하세요.');
        setLoading(false);
        console.error('API 키가 없습니다. .env에 NEXT_PUBLIC_OPENWEATHERMAP_API_KEY를 추가하세요.');
        return;
      }

      const lat = 36.7998; // 아산 위도
      const lon = 127.1375;  // 아산 경도
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

      setLoading(true);
      try {
        const response = await axios.get(url, { timeout: 5000 }); // 5초 타임아웃
        const data = response.data;
        console.log('API 응답 상세:', data); // 상세 로그
        setWeather(data);
        setError(null);
        setLastUpdated(new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || '알 수 없는 오류';
        setError(`오류: ${errorMessage}`);
        console.error('API 호출 오류:', err.response?.status, err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 300000); // 5분 간격 갱신
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-white text-xs">Loading...</div>;
  if (error) return <div className="text-white text-xs">{error}</div>;

  const windDirection = weather?.wind?.deg || 0;
  const windSpeed = weather?.wind?.speed || 0;
  const rain = weather?.rain?.['1h'] || 0;
  const temp = weather?.main?.temp || 0;
  const humidity = weather?.main?.humidity || 0;

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="fixed top-[70px] right-4 z-40">
      <div
        className="bg-gradient-to-r from-teal-500/20 to-blue-500/20 backdrop-blur-md border-2 border-teal-300 rounded-full px-5 py-3 flex items-center justify-between cursor-pointer select-none shadow-md"
        onClick={handleToggle}
      >
        <div className="flex items-center space-x-2">
          <svg className="h-5 w-5 text-teal-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
          </svg>
          <span className="text-white font-bold text-m tracking-wide font-sans">현재 날씨</span>
        </div>
        <span className="text-white text-xl leading-none">{isOpen ? '▾' : '▸'}</span>
      </div>

      {isOpen && (
        <div
          className="
            mt-2
            bg-gradient-to-br from-teal-900/10 to-blue-900/10
            backdrop-blur-md
            border-2 border-teal-300
            rounded-2xl
            shadow-lg
            px-4 py-4
            w-full sm:w-[440px]
            max-h-[60vh]
            overflow-y-auto
          "
        >
          <span className="text-gray-600 text-sm font-bold font-sans">데이터 수정일: {lastUpdated}</span>
          <div className="grid grid-cols-1 gap-2 mt-2">
            <div className="bg-gradient-to-r from-teal-500/20 to-blue-500/20 p-2 rounded-full text-white text-xs font-medium">
              온도: {temp}°C
            </div>
            <div className="bg-gradient-to-r from-teal-500/20 to-blue-500/20 p-2 rounded-full text-white text-xs font-medium">
              습도: {humidity}%
            </div>
            <div className="bg-gradient-to-r from-teal-500/20 to-blue-500/20 p-2 rounded-full text-white text-xs font-medium flex items-center">
              바람 방향: 
              <svg
                className="w-4 h-4 ml-1"
                style={{ transform: `rotate(${windDirection}deg)` }}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l8 10h-6v8h-4v-8H4l8-10z" />
              </svg>
              ({windDirection}°)
            </div>
            <div className="bg-gradient-to-r from-teal-500/20 to-blue-500/20 p-2 rounded-full text-white text-xs font-medium">
              바람 속도: {windSpeed} m/s
            </div>
            <div className="bg-gradient-to-r from-teal-500/20 to-blue-500/20 p-2 rounded-full text-white text-xs font-medium">
              강수량: {rain} mm
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherPanel;