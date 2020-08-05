import React from 'react';

//вывод цитат: если сообщение есть, то мапим в li, если нет то выводим текст НЕТ цитат
const QuotesList = ({ messages }) => {

  return (
    <ul>
      {
        messages &&
        messages.length > 0 ?
          (
            messages.map(messages => {
              return (
                <li key={messages._id}>{messages.quotes}</li>
              )
            })
          )
          :
          (
            <li>No messages</li>
          )
      }
    </ul>
  )
};

export default QuotesList;