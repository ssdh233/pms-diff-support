import React, { useState } from "react";
import ReactDOM from "react-dom";
import { useTable, useSortBy } from "react-table";

function App({ data: { result, date } }) {
  const levels = new Set(result.map((x) => x.level));
  const [selectedLevel, setSelectedLevel] = useState("P●1");

  const tableData = React.useMemo(
    () => result.filter((x) => x.level === selectedLevel),
    [result, selectedLevel]
  );

  console.log(tableData);
  const columns = React.useMemo(
    () => [
      {
        Header: "level",
        accessor: "level", // accessor is the "key" in the data
      },
      {
        Header: "title",
        accessor: "title",
        Cell: ({ row }) => (
          <a href={row.original.lr2link}>{row.values.title}</a>
        ),
      },
      {
        Header: "artist",
        accessor: "artist",
      },
      {
        Header: "mapper",
        accessor: "mapper",
      },
      {
        Header: "FC",
        accessor: "clear_fc",
        sortType: "number",
        Cell: ({ row }) => <div>{Math.floor(row.values.clear_fc, 2)}%</div>,
      },
      {
        Header: "H",
        accessor: "clear_hard",
        sortType: "number",
        Cell: ({ row }) => <div>{Math.floor(row.values.clear_hard, 2)}%</div>,
      },
      {
        Header: "N",
        accessor: "clear_normal",
        sortType: "number",
        Cell: ({ row }) => <div>{Math.floor(row.values.clear_normal, 2)}%</div>,
      },
      {
        Header: "E",
        accessor: "clear_easy",
        sortType: "number",
        Cell: ({ row }) => <div>{Math.floor(row.values.clear_easy, 2)}%</div>,
      },
      {
        Header: "count",
        accessor: "playerCount",
      },
      {
        Header: "bpm",
        accessor: "bpm",
        Cell: ({ row }) => {
          const [min, max] = row.values.bpm.split("-").map(Number);
          if (max === min) {
            return max;
          } else {
            return row.values.bpm;
          }
        },
      },
      {
        Header: "memo",
        accessor: "memo",
      },
    ],
    []
  );
  const tableInstance = useTable({ columns, data: tableData }, useSortBy);

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    tableInstance;

  return (
    <>
      <div>
        {[...levels].map((x) => (
          <button
            onClick={() => setSelectedLevel(x)}
            style={x === selectedLevel ? { color: "red" } : {}}
          >
            {x}
          </button>
        ))}
      </div>
      <table {...getTableProps()} className="mainTable">
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                  {column.render("Header")}
                  <span>
                    {column.isSorted
                      ? column.isSortedDesc
                        ? " 🔽"
                        : " 🔼"
                      : ""}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  return (
                    <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div>updated: {new Date(date).toLocaleString()}</div>
    </>
  );
}

fetch("https://ssdh233.s3.ap-northeast-1.amazonaws.com/result.json", {
  mode: "cors",
})
  .then((res) => res.json())
  .then((data) => {
    console.log(data);
    ReactDOM.render(<App data={data} />, document.getElementById("react"));
  });
