import React from 'react';
import TestEditor from './TestEditor';
import { data } from './data';

function App() {
  // console.log(props);
  return (
    <>
      <TestEditor data={data} />
    </>
  );
}
export default App;