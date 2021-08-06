import React from "react";
import ReactDOM from "react-dom";
import { useTable } from "react-table";

function App({ data: propData }) {
  const data = React.useMemo(() => propData, [propData]);
  const columns = React.useMemo(
    () => [
      {
        Header: "level",
        accessor: "level", // accessor is the "key" in the data
      },
      {
        Header: "title",
        accessor: "title",
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
        Header: "bpm",
        accessor: "bpm",
      },
      {
        Header: "fc",
        accessor: "clear_fc",
        Cell: ({ row }) => {
          const { clear_fc, playerCount } = row.values;
          return (
            <div>
              {Math.floor((Number(clear_fc) / Number(playerCount)) * 100, 2)}%
            </div>
          );
        },
      },
      {
        Header: "hard",
        accessor: "clear_hard",
        Cell: ({ row }) => {
          const { clear_fc, clear_hard, playerCount } = row.values;
          return (
            <div>
              {Math.floor(
                ((Number(clear_fc) + Number(clear_hard)) /
                  Number(playerCount)) *
                  100,
                2
              )}
              %
            </div>
          );
        },
      },
      {
        Header: "normal",
        accessor: "clear_normal",
        Cell: ({ row }) => {
          const { clear_fc, clear_hard, clear_normal, playerCount } =
            row.values;
          return (
            <div>
              {Math.floor(
                ((Number(clear_fc) +
                  Number(clear_hard) +
                  Number(clear_normal)) /
                  Number(playerCount)) *
                  100,
                2
              )}
              %
            </div>
          );
        },
      },
      {
        Header: "easy",
        accessor: "clear_easy",
        Cell: ({ row }) => {
          const {
            clear_fc,
            clear_hard,
            clear_normal,
            clear_easy,
            playerCount,
          } = row.values;

          return (
            <div>
              {Math.floor(
                ((Number(clear_fc) +
                  Number(clear_hard) +
                  Number(clear_normal) +
                  Number(clear_easy)) /
                  Number(playerCount)) *
                  100,
                2
              )}
              %
            </div>
          );
        },
      },
      {
        Header: "player_count",
        accessor: "playerCount",
      },
    ],
    []
  );
  const tableInstance = useTable({ columns, data });

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    tableInstance;

  return (
    // apply the table props
    <table {...getTableProps()}>
      <thead>
        {headerGroups.map((headerGroup) => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => (
              <th {...column.getHeaderProps()}>{column.render("Header")}</th>
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
                return <td {...cell.getCellProps()}>{cell.render("Cell")}</td>;
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

fetch("./result.json")
  .then((res) => res.json())
  .then((data) => {
    console.log(data);
    ReactDOM.render(<App data={data} />, document.getElementById("react"));
  });
