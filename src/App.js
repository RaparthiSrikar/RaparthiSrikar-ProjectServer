import './App.css';
import React, { useEffect, useState } from 'react';
import $ from 'jquery';
import 'datatables.net';
import './App.css'

function App() {
  const [jsonData, setJsonData] = useState([]);
  const [dataInitialized, setDataInitialized] = useState(false);

  useEffect(() => {
    if (!dataInitialized) {
      initializeData();
      setDataInitialized(true);
    }
  }, [dataInitialized]); // Run when dataInitialized changes

  function initializeData() {
    $.ajax({
      url: "http://localhost:5000/api/filter?month=3",
      type: "Get",
      contentType: 'application/json',
      crossDomain: true,
      xhrFields: {
        withCredentials: true
      },
      success: function (result) {
        var tableContent = '';
        result.forEach(item => {
          tableContent += `
          <tr>
            <td>${item.id}</td>
            <td>${item.title}</td>
            <td>${item.description}</td>
            <td>${item.price}</td>
            <td>${item.category}</td>
            <td>${item.sold}</td>
            <td><img src='${item.image}' width='50' height='50' /></td>
          </tr>`
        });
        $('#dataTableBody').html(tableContent);
        initializeDataTable();

        $('.dataTable').DataTable().page.len(10).draw();
      },
      error: function (xhr, status, error) {
        console.log(error);
      }
    });
  }

  function initializeDataTable() {
    if (!$.fn.DataTable.isDataTable('.dataTable')) {
      $('.dataTable').DataTable({
        paging: true,
        searching: true,
        ordering: true,
        pageLength: 10
      });
    }
  }
  function getFilterData(value) {
    $.ajax({
      url: `http://localhost:3004/api/filter?month=${value}`,
      type: 'GET',
      processData: false,
      contentType: false,
      success: function (result) {
        let tableContent = '';
        $('#dataTableBody').empty();
        $('.dataTable').DataTable().destroy();
        result.forEach(item => {
          tableContent += `
        <tr>
          <td>${item.id}</td>
          <td>${item.title}</td>
          <td>${item.description}</td>
          <td>${item.price}</td>
          <td>${item.category}</td>
          <td>${item.sold}</td>
          <td><img src='${item.image}' width='50' height='50' /></td>
        </tr>`
        });
        $('#dataTableBody').html(tableContent);
        
      },
      error: function (xhr, status, error) {
        console.error('There was a problem with the AJAX request:', error);
      }
    });
  }


  return (
    <div>
      <input id='searchByTransaction' type='text' className='form-control'></input>
      <select id="searchByMonth" defaultValue={3} onChange={(event) => getFilterData(event.target.value)}>
        <option value={-1}>Select Month</option>
        <option value={1}>January</option>
        <option value={2}>February</option>
        <option value={3}>March</option>
        <option value={4}>April</option>
        <option value={5}>May</option>
        <option value={6}>June</option>
        <option value={7}>July</option>
        <option value={8}>August</option>
        <option value={9}>September</option>
        <option value={10}>October</option>
        <option value={11}>November</option>
        <option value={12}>December</option>
      </select>

      <table className='dataTable'>
        <thead>
          <tr>
            <td>Id</td>
            <td>Title</td>
            <td>Description</td>
            <td>Price</td>
            <td>Category</td>
            <td>Sold</td>
            <td>Image</td>
          </tr>
        </thead>
        <tbody id="dataTableBody"></tbody>
      </table>
    </div>
  );
}

export default App;
