import React from 'react'
import CoffeeSvg from '@/assets/coffee.svg?react';

interface WebTitleProps {
  collapsed: boolean;
}

const WebTitle: React.FC<WebTitleProps> = ({ collapsed }) => {
  return (
    <div className={`flex flex-row items-center ${collapsed ? 'justify-center' : ''}`}>
      <CoffeeSvg width={35} height={35} fill='brown' />
      {!collapsed && (
        <div className='ml-2'>
          {/* <span className='text-2xl font-bold text-gray-800'>萃豆</span> */}
          <span className='text-3xl text-gray' style={{ fontFamily: 'STCaiyun, 华文彩云' }}>萃豆馆</span>
        </div>
      )}
    </div>
  )
}

export default WebTitle