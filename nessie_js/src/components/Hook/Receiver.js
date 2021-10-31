import React, { useEffect, useState } from 'react';
import { List } from 'antd';

const Receiver = ({ payload }) => {
  const [messages, setMessages] = useState([])

  useEffect(() => {
    if (payload.topic) {
      setMessages(messages => [...messages, payload])
    }
  }, [payload])

  const renderListItem = (item) => {
    const timestamp_ms = JSON.parse(item.message).timestamp_ms;
    const timeString = new Date(timestamp_ms).toLocaleString();
    return <List.Item>
      <List.Item.Meta
        title={`${timeString} - ${item.topic}`}
        description={item.message}
      />
    </List.Item>
  }

  return (
    <>
      <List
        size="small"
        bordered
        dataSource={messages}
        renderItem={renderListItem}
      />
    </>
  );
}

export default Receiver;
