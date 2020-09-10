# Agenda

import os
class agenda:
    nombres = []
    numeros = []
    correos = []
    def __init__(self, nombres, numeros, correos):
        self.nombres = nombres
        self.numeros = numeros
        self.correos = correos
    
    def agregarContactos(self, nom, num, cor):
        self.nombres.append(nom)
        self.numeros.append(num)
        self.correos.append(cor)
    
    def buscarContacto(self, nom):
        if (nom in self.nombres): 
            print("\n Nombre: ", nom)
            indiceContacto = self.nombres.index(nom)
            print("\n Telefono: ", self.numeros[indiceContacto]) 
            print("\n Correo: ", self.correos[indiceContacto])
        else:
            print("Contacto no encontrado")
    
    def verContactos(self):
        os.system("cls")
        if len(self.nombres) == 0:
            print("No hay contactos por mostrar")
        else: 
            for nombre in self.nombres:
                indiceContacto = self.nombres.index(nombre)
                print("\n El numero de ", nombre, "es: ", self.numeros[indiceContacto], "y su correo: ", self.correos[indiceContacto])
    
    def eliminarContacto(self): 
        nombre = input("¿Que contacto deseas borrar?: ")
        os.system("cls")
        if nombre in self.nombres:
                indiceContacto = self.nombres.index(nombre)
                del self.nombres[indiceContacto]
                del self.numeros[indiceContacto]
                del self.correos[indiceContacto]
                
			    
        else:
                print("\Contacto no encontrado")
                
print("Agenda\n")


listaNombres = []
listaNumeros = []
listaCorreos = []            

agenda = agenda(listaNombres, listaNumeros, listaCorreos)

while True:
    print("\n\t1.-Agregar un contacto")
    print("\n\t2.-Buscar un contacto")
    print("\n\t3.-Ver todos los contactos")
    print("\n\t4.-Eliminar un contacto")
    print("\n\t5.- Salir")
    
    opcionMenu = int(input("Opcion: "))
    if opcionMenu ==1:
        nombre = input("Ingrese el nombre del contacto: ")
        numero = input("Ingrese el Telefono del contacto: ")
        correo = input("Ingrese el correo del contacto:")
        agenda.agregarContactos(nombre, numero, correo)
        os.system("cls")
    
    elif opcionMenu == 2:
        nombre = input("¿Que contacto deseas buscar? ")
        os.system("cls")
        agenda.buscarContacto(nombre)
        
        
    elif opcionMenu == 3:
         agenda.verContactos()
         
    elif opcionMenu == 4:
        agenda.eliminarContacto()
    
    elif opcionMenu == 5:
        os.system("cls")
        print("Sesion terminada")
        break
    
    else: 
        os.system("cls")
        print("Opcion no valida")
