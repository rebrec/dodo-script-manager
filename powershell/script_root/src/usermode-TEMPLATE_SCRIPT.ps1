$global:DODO_SCRIPT_NAME       = "SOME_SCRIPT_NAME"
$global:DODO_SCRIPT_VERSION    = "SOME_VERSION"

###################################################################################################
## If needed, you can override the global:Get-UniqueExecutionId  cmdlet to change the unique Identifier
## associated with every computer
## this identifier will be persisted server side
## by default, the identifier is the computer HOSTNAME
## which mean that scripts will only be executed once per computer
## If for instance you want to run a script on a per machine and per user
## you can create a uniqueid based on both the hostname and the username as below
## Function global:Get-UniqueExecutionId {  
##     return "$env:COMPUTERNAME-$env:USERNAME"
## }
###################################################################################################

###################################################################################################
## If needed, you can also define prerequisite conditions that need to be met
## before any execution of the script occurs. This is done buy overriding the function below  
## Function global:isDodoExecutionContextCorrect {
##     if ((get-date).DayOfWeek -eq "Tuesday"){
##         return $true # return $true to allow execution
##     } else {
##         return $false # return $false to forbid execution
##     }
## }
###################################################################################################
Function Main{
    param()
    # Your code goes here
	$previousInstalledPrinters = (Get-WmiObject -query "Select * From Win32_Printer" | Select -ExpandProperty Name)
	logDodo "[+] Imprimantes installees avant migration :"
	logDodo $previousInstalledPrinters
	
	$res = . "$scriptPath\start.cmd"
	logDodo "[+] Résultat de l'exécution de $scriptPath\start.cmd : "
	logDodo $res 
	
	$newlyInstalledPrinters = (Get-WmiObject -query "Select * From Win32_Printer" | Select -ExpandProperty Name)
	logDodo "[+] Imprimantes installees apres migration :"
	logDodo $newlyInstalledPrinters
	
	$oldPrinterStillPresent = ($newlyInstalledPrinters | % { $_ -ilike '*imp02*'}) -contains $true
	if ($oldPrinterStillPresent) {
		logDodo "[ /!\ ] Erreur : des imprimantes pointent encore vers srv-imp02"
		return $false
	} else {
		logDodo "[  V  ] Toutes les imprimantes ont été migrées"
		return $true
	}
	# We save the execution status so that we do not execute it twice
    
}
