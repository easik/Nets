# Generate MIPT IPs and create whitelist from them
# Hacked via iplocation.net and mxtoolbox.com/subnetcalculator.aspx
#
# (C) 2019, Valentine Akhiarov
#

mipt_ip_list = []
for i in range(0, 31 + 1):
    for j in range(0, 255 + 1):
        mipt_ip_list.append('93.175.' + str(i) + '.' + str(j))

with open("whitelist.txt", "w") as text_file:
    text_file.write(str(mipt_ip_list).replace("', '", "\n").replace("'", "").replace("[", "").replace("]", ""))
