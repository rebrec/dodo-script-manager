$scriptPath = split-path -parent $MyInvocation.MyCommand.Definition

# Change thoses values as wished
$global:DEFAULT_DODO_BASE_DIR     = "$scriptPath" 
#$global:DEFAULT_DODO_BIN_DIR 	  = "some specific path ?"
$global:DEFAULT_DODO_LIB_PATH     = "$scriptPath\..\client\dodoLib.ps1"
#$global:DEFAULT_SpecificScript    = "The\full\path\to\a\dodo\script\you\want\to\test"
#$global:DEFAULT_DODO_Debug        = $true
