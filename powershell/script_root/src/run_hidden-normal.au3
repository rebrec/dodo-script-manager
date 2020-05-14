#AutoIt3Wrapper_UseUpx=y
#AutoIt3Wrapper_Change2CUI=n
ConsoleWrite("Run_Wait" & @CRLF)

$params = ""

For $i = 1 To $CmdLine[0]
    $params = $params & " " & $CmdLine[$i]
 Next

ConsoleWrite("Received Params : " & @CRLF)
ConsoleWrite($params & @CRLF)
ConsoleWrite("Run_Wait" & @CRLF)

RunWait(@ComSpec & " /c " & $params, "", @SW_HIDE)

