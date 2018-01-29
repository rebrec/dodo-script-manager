$scriptPath = split-path -parent $MyInvocation.MyCommand.Definition

$global:DODO_HOSTNAME = "localhost"
$global:DODO_PORT = 8088
Import-Module "$scriptPath\dodoConfig.ps1"

$global:DODO_BASE_URL          = "http://$DODO_HOSTNAME" + ":" + "$DODO_PORT/api/script"
$global:DODO_SCRIPT_NAME       = "Scriptname-not-defined"
$global:DODO_SCRIPT_VERSION    = "Scriptversion-not-defined"

[System.Collections.ArrayList]$global:DODO_LOGS = @()

#override this function if you need a different way to identify unique execution (per user, per computer, etc)
Function global:Get-UniqueExecutionId {  
    return "$env:COMPUTERNAME"
}

Function global:Get-AdditionnalData{
    return @{
            username           = $env:USERNAME
            computername       = $env:COMPUTERNAME
            os                 = $env:OS
            powershell_version = "$($host.version)"
            logs               = $DODO_LOGS
			executed		   = $true
    }
}

Function logDodo{
    param($message)
    if ($message -is [array]) { $message | %{ logDodo($_) }} # we can receive command output stored into a variable as an array of lines.
    else { 
        $global:DODO_LOGS.Add($message) | out-null 
        Write-Host "$message"
    }
}

Function isAlreadyExecuted {
    param()
    $url = "$DODO_BASE_URL/$DODO_SCRIPT_NAME/$DODO_SCRIPT_VERSION/$(Get-UniqueExecutionId)"
    $request = [System.Net.HttpWebRequest]::Create($url)
    $request.Method = "GET"
    #$request.ContentType = "application/json"

    $state = Invoke-RestMethod -Method Get -Uri $url
    if ($state.status -ne 'success'){ 
        Write-Host "Error calling isAlreadyExecuted, returned non successfull value"
        # Check wether the Log function is defined :
        if ($(Get-ChildItem function: | where {$_.name -eq 'Log' }) -ne $null) {
            Log "Something went wrong while running isAlreadyExecuted function. Result is $(ConvertTo-JSON $state)"
        }
        return $false # default is to run if no answer from the server
    }
    $res = $($state.data)
    Write-Host "isAlreadyExecuted : $res"
    
    return $res
}

Function Save-ExecutionStatus {
    param($executed=$true)
	$additionalData = Get-AdditionnalData
	$additionalData.executed = $executed
    $additionnalJSONData = ConvertTo-Json $additionalData
	
    $state = Invoke-RestMethod -Method Put -Uri "$DODO_BASE_URL/$DODO_SCRIPT_NAME/$DODO_SCRIPT_VERSION/$(Get-UniqueExecutionId)" -ContentType 'application/json' -Body $additionnalJSONData
    if ($state.status -ne 'success'){ 
        Write-Host "Error calling isAlreadyExecuted, returned non successfull value"
        # Check wether the Log function is defined :
        if ($(Get-ChildItem function: | where {$_.name -eq 'Log' }) -ne $null) {
            Log "Something went wrong while running Save-ExecutionStatus function. Result is $(ConvertTo-JSON $state)"
        }
        return $false # default is to run if no answer from the server
    }
    Write-Host "Save-ExecutionStatus : done"
    return $state.data
}

# For compatibility with Powershell v2
if ($PSVersionTable.PSVersion -eq "2.0") {
	Function ConvertTo-JSON([object] $item){
		add-type -assembly system.web.extensions
		$ps_js=new-object system.web.script.serialization.javascriptSerializer
		return $ps_js.Serialize($item)
	}
    function ConvertFrom-Json([object] $item){ 
        add-type -assembly system.web.extensions
        $ps_js=new-object system.web.script.serialization.javascriptSerializer
    
        #The comma operator is the array construction operator in PowerShell
        return ,$ps_js.DeserializeObject($item)
    }
    function Invoke-RestMethod {
        param($Method,$Uri, $Body, $ContentType)
        $client = New-Object System.Net.WebClient
        if ($Method -ieq "Get"){
            $json = $client.DownloadString($Uri)
            $res = ConvertFrom-Json $json
            return $res
        } elseif ($Method -ieq "Put"){
            if ($PSBoundParameters.ContainsKey('ContentType')) {
                $client.Headers["Content-Type"] = $ContentType
            }
            $json = $client.UploadString($Uri, $Method, $Body)
            $res = ConvertFrom-Json $json
            return $res
        } else {
            throw "Unknown Method : $Method (only GET and PUT are currently implemented)"
        }
       
    }    
}

