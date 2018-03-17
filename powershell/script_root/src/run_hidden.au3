#RequireAdmin
#AutoIt3Wrapper_UseUpx=y

$params = ""

For $i = 1 To $CmdLine[0]
    $params = $params & " " & $CmdLine[$i]
Next

RunWait(@ComSpec & " /c " & $params, "", @SW_HIDE)

