import { useState, useEffect } from 'react'
import { Box, Chip, Button, Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, TableContainer } from '@mui/material'
import Papa from 'papaparse'
import { read, utils } from 'xlsx'

export default function Loader(props) {
  const [csvData, setCsvData] = useState([])
  const [summaryData, setSummaryData] = useState([])

  useEffect(() => {
    var students = {}
    var summary = []

    for (const line of csvData) {
      if (!students[line["Student Id"]]) {
        students[line["Student Id"].toString()] = { 
          name: `${line["Student Nickname"]} ${line["Student Last Name"]}`,
          grades: []
        } 
      }
      students[line["Student Id"].toString()].grades = [...students[line["Student Id"].toString()].grades, line["Final Mark"]]
    }

    for (const [student_key, student] of Object.entries(students)) {
      var total = 0
      var count = student.grades.length

      for (const grade of student.grades) {
        if (Number.isFinite(grade)) {
          total += grade
        } else {
          count -= 1
        }
      }

      summary.push({ id: student_key, name: student.name, average: 1.0 * total / count })
    }

    summary.sort((a, b) => {
      if (!Number.isFinite(a.average) && !Number.isFinite(b.average)) { return 0 }
      if (!Number.isFinite(a.average)) { return 1 }
      if (!Number.isFinite(b.average)) { return -1 }
      return b.average - a.average
    })
    setSummaryData([...summary])
  }, [csvData])

  function handleFileUpload(event) {
    if (!event.target.files) {
      return
    }
    const file = event.target.files[0]

    if (file.type.includes("csv")) {
      Papa.parse(event.target.files[0], {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          setCsvData(results.data)
        }
      })
    } else {
      var reader = new FileReader()
      reader.onload = (e) => {
        var data = e.target.result
        var workbook = read(data, {
          type: 'binary'
        })
        const sheetName = workbook.SheetNames[0];
        var worksheet = workbook.Sheets[sheetName];
        var data = utils.sheet_to_json(worksheet, {
          raw: true
        })
        setCsvData(data)
      }
      reader.readAsBinaryString(event.target.files[0])
    }
  }

  function tableRows() {
    
  }

  return (
    <Container sx={{ mt: 2 }}>
      <Typography variant="h6">Pacific Academy</Typography>
      <Typography variant="h4">Governor General's Award calculation</Typography>
      <Box sx={{ displayPrint: "none" }}>
        <Typography variant="body1" sx={{ mt: 2 }}>
          This calculates overall average percentage for students, based on final marks in PCR.
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          The data downloaded from PCR should contain at least the following columns:
          <Chip sx={{ mx: 1 }} size="small" label="Student Id"/>
          <Chip sx={{ mx: 1 }} size="small" label="Student Nickname"/>
          <Chip sx={{ mx: 1 }} size="small" label="Student Last Name"/>
          <Chip sx={{ mx: 1 }} size="small" label="Final Mark"/>
        </Typography>
        <Typography variant="body1">
          The file should be one of the following types:
          <Chip sx={{ mx: 1 }} size="small" label=".csv"/>
          <Chip sx={{ mx: 1 }} size="small" label=".xls"/>
          <Chip sx={{ mx: 1 }} size="small" label=".xlsx"/>
        </Typography>
        <Button variant="contained" component="label" sx={{ my: 3 }}>
          Upload File
          <input 
            hidden 
            accept="application/csv,text/csv,application/vnd.ms-excel,application/xls,application/x-xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msexcel,application/x-msexcel,application/x-ms-excel,application/x-excel"
            type="file"
            onChange={handleFileUpload}
            />
        </Button>
        { summaryData.length > 0 &&
          <Button variant="contained" color="secondary" sx={{ mx: 2 }} onClick={() => { window.print(); return false }}>
            Print Results
          </Button>
        }
      </Box>
      { summaryData.length > 0 &&
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Student ID</TableCell>
                <TableCell>Student Name</TableCell>
                <TableCell align="right">Average %</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              { 
                summaryData.map((row, idx) => {
                  return (
                    <TableRow key={idx}>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell align="right">{row.average.toFixed(2)}</TableCell>
                    </TableRow>
                  )
                }) 
              }
            </TableBody>
          </Table>
        </TableContainer>
      }
    </Container>
  )
}